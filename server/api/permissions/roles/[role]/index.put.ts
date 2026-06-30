// server/api/permissions/roles/[role]/index.put.ts
/**
 * 📍 Эндпоинт: PUT /api/permissions/roles/[role]
 *
 * Назначение:
 * - Обновление прав доступа для указанной роли
 * - Используется в UI настроек прав (вкладка "Роли")
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Защита:
 *   - Роль admin может изменять только admin
 *   - Нельзя отозвать права на системные страницы у роли admin
 *
 * Логика (упрощённая, без canView):
 * 1. Валидация входящих данных (zod через validateUpdateRolePermissions)
 * 2. Получение списка активных страниц для валидации slug
 * 3. Для каждой страницы — UPSERT в permissionsRoleAccess (в транзакции)
 * 4. Инвалидация кэша прав для ВСЕХ пользователей этой роли
 * 5. 🆕 Уведомление пользователей через сокет + принудительный разрыв при критичных изменениях
 *
 * Видимость раздела:
 * - Раздел автоматически виден в меню, если есть хотя бы одно действие (create/edit/delete/special)
 * - canView упразднён — больше нет отдельного флага просмотра
 *
 * @param {string} role — роль из пути (admin, manager, foreman, master, worker)
 * @body { description?: string, permissions: Record<string, PagePermissions> }
 * @returns { role, description, updatedCount, invalidatedUsers, disconnectedUsers, permissions }
 */
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../db'
import {
  permissionsPages,
  permissionsRoleAccess,
  users
} from '../../../../db/schema'
import {
  validateUpdateRolePermissions,
  validateRoleParam,
  type UpdateRolePermissionsInput
} from '../../../../utils/permissions/validators'
import {
  invalidatePermissionsCacheByRole,
  type DbUser
} from '../../../../utils/permissions'
import {
  hasRequiredRoleLevel,
  ROLE_LABELS,
  type Role
} from 'shared/constants/roles'
import type { PagePermissions } from 'shared/types/permissions'
import { getIO } from '../../../../socket/common'
import { getRoleRoomName } from '../../../../socket/utils'
import { forceDisconnectRole } from '../../../../socket'

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Страницы, потеря доступа к которым требует принудительного отключения пользователей.
 * 
 * Если у роли отозвали все действия (create/edit/delete/special) на одну из этих страниц —
 * пользователи больше не смогут работать в системе (не увидят меню, не смогут открыть объекты/работы).
 * В таких случаях безопаснее принудительно разорвать соединение и отправить на relogin.
 */
const CRITICAL_PAGES_FOR_DISCONNECT = ['dashboard', 'objects', 'works'] as const

// ============================================
// ОБРАБОТЧИК
// ============================================

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ПРОВЕРКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const currentUser = event.context.user as DbUser | undefined
  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не удалось получить данные текущего пользователя'
    })
  }

  // ============================================
  // 2. ВАЛИДАЦИЯ РОЛИ ИЗ URL
  // ============================================
  const roleParam = getRouterParam(event, 'role')
  const targetRole: Role = validateRoleParam(roleParam)

  // ============================================
  // 3. ЗАЩИТА: РОЛЬ ADMIN МЕНЯЕТ ТОЛЬКО ADMIN
  // ============================================
  if (targetRole === 'admin' && !hasRequiredRoleLevel(currentUser.role as Role, 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может изменять права роли admin'
    })
  }

  // ============================================
  // 4. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА (через zod)
  // ============================================
  const body = await readBody(event)
  const validated: UpdateRolePermissionsInput = validateUpdateRolePermissions(body)

  // ============================================
  // 5. ПОЛУЧЕНИЕ СПИСКА АКТИВНЫХ СТРАНИЦ ДЛЯ ВАЛИДАЦИИ SLUG
  // ============================================
  const allPages = await db
    .select({
      slug: permissionsPages.slug,
      name: permissionsPages.name,
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
  // 6. ПОЛУЧЕНИЕ ТЕКУЩИХ ПРАВ РОЛИ (для определения критичности изменений)
  // ============================================
  const currentAccess = await db
    .select({
      pageSlug: permissionsRoleAccess.pageSlug,
      canView: permissionsRoleAccess.canView,
      canCreate: permissionsRoleAccess.canCreate,
      canEdit: permissionsRoleAccess.canEdit,
      canDelete: permissionsRoleAccess.canDelete,
      canSpecial: permissionsRoleAccess.canSpecial
    })
    .from(permissionsRoleAccess)
    .where(
      eq(permissionsRoleAccess.role, targetRole as any)
    )

  const currentMap = new Map(currentAccess.map(a => [a.pageSlug, a]))

  // ============================================
  // 7. ОБНОВЛЕНИЕ ПРАВ В ТРАНЗАКЦИИ
  // ============================================
  const result = await db.transaction(async (tx) => {
    let updatedCount = 0
    const finalPermissions: Record<string, PagePermissions> = {}

    for (const [slug, perms] of Object.entries(validated.permissions)) {
      const page = pagesMap.get(slug)!

      // Фильтруем: передаём только те действия, которые страница поддерживает.
      // canView упразднён — всегда false (для совместимости с БД, но не используется)
      const canView = perms.canView ?? false
      const canCreate = page.hasCreate && perms.canCreate === true
      const canEdit = page.hasEdit && perms.canEdit === true
      const canDelete = page.hasDelete && perms.canDelete === true
      const canSpecial = page.hasSpecial && perms.canSpecial === true

      // UPSERT: вставляем или обновляем если уже есть (через uniqueRolePage индекс)
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
            updatedBy: currentUser.id,
            updatedAt: new Date()
          }
        })

      updatedCount++

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

  // ============================================
  // 8. ИНВАЛИДАЦИЯ КЭША ПРАВ (через утилиту из utils/permissions)
  // ============================================
  const invalidationResult = await invalidatePermissionsCacheByRole(targetRole)

  // ============================================
  // 9. АНАЛИЗ КРИТИЧНОСТИ ИЗМЕНЕНИЙ
  // ============================================
  // Определяем, были ли отозваны ВСЕ действия у критических страниц.
  // Если да — пользователей нужно принудительно отключить (forceDisconnectRole),
  // т.к. они не смогут нормально работать с системой.
  const criticalRevocations: string[] = []

  for (const pageSlug of CRITICAL_PAGES_FOR_DISCONNECT) {
    const newPerms = result.permissions[pageSlug]
    const oldPerms = currentMap.get(pageSlug)

    // Было хотя бы одно действие, стало ни одного → критичное изменение
    const hadAccess = oldPerms && (
      oldPerms.canView || oldPerms.canCreate || oldPerms.canEdit ||
      oldPerms.canDelete || oldPerms.canSpecial
    )
    const hasAccess = newPerms && (
      newPerms.canView || newPerms.canCreate || newPerms.canEdit ||
      newPerms.canDelete || newPerms.canSpecial
    )

    if (hadAccess && !hasAccess) {
      criticalRevocations.push(pageSlug)
    }
  }

  const requiresDisconnect = criticalRevocations.length > 0

  // ============================================
  // 10. ЛОГИРОВАНИЕ
  // ============================================
  // console.log(
  //   `[Permissions] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
  //   `обновил ${result.updatedCount} страниц для роли "${targetRole}" ` +
  //   `(${ROLE_LABELS[targetRole]}). ` +
  //   `Кэш инвалидирован для ${invalidationResult.invalidated}/${invalidationResult.total} пользователей. ` +
  //   `Критичных отзывов: ${criticalRevocations.length}` +
  //   (criticalRevocations.length > 0 ? ` [${criticalRevocations.join(', ')}]` : '')
  // )

  // ============================================
  // 11. 🆕 УВЕДОМЛЕНИЕ ПОЛЬЗОВАТЕЛЕЙ ЧЕРЕЗ СОКЕТ
  // ============================================
  const io = getIO()
  let disconnectedUsers = 0

  if (io) {
    if (requiresDisconnect) {
      // Критичные изменения — принудительное отключение.
      // Пользователи получат 'force:disconnect' и будут перенаправлены на /login.
      disconnectedUsers = forceDisconnectRole(
        io,
        targetRole,
        `Права роли "${ROLE_LABELS[targetRole]}" были существенно изменены. Необходимо войти заново.`
      )
    } else {
      // Обычные изменения — мягкое уведомление.
      // Клиентский socketStore поймает событие и вызовет authStore.init() для перезагрузки прав.
      io.to(getRoleRoomName(targetRole)).emit('permissions:changed', {
        reason: `Администратор ${currentUser.name} обновил права роли "${ROLE_LABELS[targetRole]}"`,
        changedPages: Object.keys(validated.permissions),
        requireRelogin: false,
        timestamp: new Date().toISOString()
      })
    }
  }

  // ============================================
  // 12. ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================
  return {
    role: targetRole,
    description: validated.description || null,
    updatedCount: result.updatedCount,
    invalidatedUsers: invalidationResult.invalidated,
    disconnectedUsers,
    permissions: result.permissions
  }
})
