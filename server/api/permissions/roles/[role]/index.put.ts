// server/api/permissions/roles/[role]/index.put.ts
/**
 * 📍 Эндпоинт: PUT /api/permissions/roles/[role]
 *
 * Назначение:
 * Обновление прав доступа для указанной роли
 * Принимает объект с правами для каждой страницы и применяет их
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Роль admin не может быть ограничена (защищено от случайного удаления прав)
 *
 * Логика:
 * 1. Валидация входящих данных
 * 2. Проверка что роль существует
 * 3. Получение текущего списка страниц для валидации slug
 * 4. Для каждой страницы — upsert в permissionsRoleAccess
 * 5. Всё в транзакции (атомарность)
 *
 * Новая система прав:
 * - canView, canCreate, canEdit, canDelete, canSpecial
 * - Без legacy (canExport, canApprove)
 *
 * @param {string} role — роль из пути (admin, manager, foreman, master, worker)
 * @body { description?: string, permissions: Record<string, PagePermissions> }
 * @returns { role, updatedCount, permissions } — обновлённые данные
 *
 * Пример body:
 * {
 *   "description": "Мастер с расширенными правами",
 *   "permissions": {
 *     "dashboard": { "canView": true },
 *     "objects": { "canView": true, "canCreate": true, "canEdit": true, "canDelete": true },
 *     "works": { "canView": true, "canEdit": true, "canSpecial": true }
 *   }
 * }
 */
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db, users } from '../../../../db'
import { permissionsPages, permissionsRoleAccess } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import {
  validateUpdateRolePermissions,
  isValidRole,
  type Role,
} from '../../../../utils/permissions/validators'
import type { PagePermissions } from '../../../../utils/permissions/types'
import type { DbUser } from '../../../../utils/permissions'
import { invalidatePermissionsCache } from '../../../../middleware/auth'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ПАРАМЕТРА РОЛИ
  // ============================================
  const roleParam = getRouterParam(event, 'role')
  if (!roleParam) {
    throw createError({ statusCode: 400, statusMessage: 'Роль не указана в URL' })
  }

  if (!isValidRole(roleParam)) {
    throw createError({ statusCode: 400, statusMessage: `Некорректная роль: ${roleParam}` })
  }

  // ✅ Приводим к строгому типу Role
  const targetRole: Role = roleParam

  // ============================================
  // 2. ЗАЩИТА ОТ ИЗМЕНЕНИЯ РОЛИ ADMIN
  // ============================================
  if (targetRole === 'admin' && currentUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может изменять права роли admin'
    })
  }

  // ============================================
  // 3. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody(event)
  const validated = validateUpdateRolePermissions(body)

  // ============================================
  // 4. ПОЛУЧЕНИЕ СПИСКА АКТИВНЫХ СТРАНИЦ
  // ============================================
  const allPages = await db
    .select({
      slug: permissionsPages.slug,
      hasCreate: permissionsPages.hasCreate,
      hasEdit: permissionsPages.hasEdit,
      hasDelete: permissionsPages.hasDelete,
      hasSpecial: permissionsPages.hasSpecial
    })
    .from(permissionsPages)
    .where(eq(permissionsPages.isActive, true))

  const pagesMap = new Map(allPages.map(p => [p.slug, p]))

  // Проверка что все переданные slug существуют в БД
  for (const slug of Object.keys(validated.permissions)) {
    if (!pagesMap.has(slug)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Страница "${slug}" не существует в системе`
      })
    }
  }

  // ============================================
  // 5. ОБНОВЛЕНИЕ ПРАВ В ТРАНЗАКЦИИ
  // ============================================
  try {
    const result = await db.transaction(async (tx) => {
      let updatedCount = 0
      const finalPermissions: Record<string, PagePermissions> = {}

      for (const [slug, perms] of Object.entries(validated.permissions)) {
        const page = pagesMap.get(slug)!

        // ✅ Фильтруем: передаём только те действия, которые страница поддерживает
        const canView = perms.canView ?? false
        const canCreate = page.hasCreate && perms.canCreate === true
        const canEdit = page.hasEdit && perms.canEdit === true
        const canDelete = page.hasDelete && perms.canDelete === true
        const canSpecial = page.hasSpecial && perms.canSpecial === true

        // UPSERT: вставляем или обновляем если уже есть
        await tx.insert(permissionsRoleAccess)
          .values({
            role: targetRole,
            pageSlug: slug,
            canView,
            canCreate,
            canEdit,
            canDelete,
            canSpecial,
            comment: validated.description || null,
            updatedBy: currentUser.id,
            isActive: true
          })
          .onDuplicateKeyUpdate({
            set: {
              canView,
              canCreate,
              canEdit,
              canDelete,
              canSpecial,
              comment: validated.description || null,
              updatedBy: currentUser.id
            }
          })

        updatedCount++

        // Сохраняем финальные права для ответа
        finalPermissions[slug] = {
          canView,
          canCreate,
          canEdit,
          canDelete,
          canSpecial
        }
      }

      return { updatedCount, permissions: finalPermissions }
    })

    // ✅ Инвалидируем кэш прав для всех пользователей этой роли
    const usersWithRole = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, targetRole))

    for (const user of usersWithRole) {
      invalidatePermissionsCache(user.id)
    }

    console.log(
      `[Права] ✅ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `обновил ${result.updatedCount} страниц для роли "${targetRole}". ` +
      `Инвалидирован кэш для ${usersWithRole.length} пользователей`
    )

    return {
      role: targetRole,
      description: validated.description || null,
      updatedCount: result.updatedCount,
      permissions: result.permissions
    }
  } catch (error: any) {
    console.error(`[Права] ❌ Ошибка обновления прав для роли "${targetRole}":`, error)

    // Пробрасываем HTTP-ошибки (400, 403) как есть
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при обновлении прав роли'
    })
  }
})
