// server/api/permissions/roles/copy.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/roles/copy
 *
 * Назначение:
 * Скопировать все права доступа из одной роли в другую
 * Существующие права целевой роли будут полностью заменены
 *
 * ⚠️ Доступ: только для роли admin
 * ⚠️ Если целевая роль admin — только другой admin может это делать
 *
 * Логика:
 * 1. Валидация body через zod (from и to — разные валидные роли)
 * 2. Защита: только админ может копировать в роль admin
 * 3. Получение всех прав из исходной роли
 * 4. В транзакции:
 *    - Удаление всех текущих прав целевой роли
 *    - Создание новых прав на основе исходных
 * 5. Инвалидация кэша для всех пользователей целевой роли
 * 6. Логируем на русском языке
 *
 * @body { from: Role, to: Role }
 * @returns { from, to, copiedCount, previousCount }
 *
 * Пример body:
 * {
 *   "from": "manager",
 *   "to": "foreman"
 * }
 *
 * Пример ответа:
 * {
 *   "from": "manager",
 *   "to": "foreman",
 *   "copiedCount": 7,
 *   "previousCount": 5,
 *   "message": "Скопировано 7 прав из роли manager в роль foreman"
 * }
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../db'
import { users, permissionsRoleAccess } from '../../../db/schema'
import { eq, sql, and } from 'drizzle-orm'
import { validateCopyRolePermissions } from '../../../utils/permissions/validators'
import { invalidatePermissionsCache } from '../../../middleware/auth'
import type { DbUser } from '../../../utils/permissions'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ТОЛЬКО АДМИН
  // ============================================
  if (currentUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Копирование прав между ролями доступно только администратору'
    })
  }

  // ============================================
  // 2. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody(event)
  const validated = validateCopyRolePermissions(body)
  const { from: fromRole, to: toRole } = validated

  // ============================================
  // 3. ПОЛУЧЕНИЕ ПРАВ ИСХОДНОЙ РОЛИ (новая система: без canExport/canApprove)
  // ============================================
  const sourcePermissions = await db
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
      and(
        eq(permissionsRoleAccess.role, fromRole),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  if (sourcePermissions.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `У роли "${fromRole}" нет настроенных прав для копирования`
    })
  }

  // ============================================
  // 4. ПОДСЧЁТ ТЕКУЩИХ ПРАВ ЦЕЛЕВОЙ РОЛИ
  // ============================================
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissionsRoleAccess)
    .where(eq(permissionsRoleAccess.role, toRole))
  const previousCount = Number(countResult?.count || 0)

  // ============================================
  // 5. КОПИРОВАНИЕ В ТРАНЗАКЦИИ
  // ============================================
  try {
    const copiedCount = await db.transaction(async (tx) => {
      // 5.1. Удаляем все существующие права целевой роли
      await tx
        .delete(permissionsRoleAccess)
        .where(eq(permissionsRoleAccess.role, toRole))

      // 5.2. Создаём новые права на основе исходных (новая система)
      if (sourcePermissions.length > 0) {
        await tx.insert(permissionsRoleAccess).values(
          sourcePermissions.map(p => ({
            role: toRole,
            pageSlug: p.pageSlug,
            canView: p.canView,
            canCreate: p.canCreate,
            canEdit: p.canEdit,
            canDelete: p.canDelete,
            canSpecial: p.canSpecial,
            comment: `Скопировано из роли "${fromRole}" пользователем ${currentUser.name}`,
            updatedBy: currentUser.id,
            isActive: true
          }))
        )
      }

      return sourcePermissions.length
    })

    // ============================================
    // 6. ИНВАЛИДАЦИЯ КЭША ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ЦЕЛЕВОЙ РОЛИ
    // ============================================
    const usersWithTargetRole = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, toRole))

    for (const user of usersWithTargetRole) {
      invalidatePermissionsCache(user.id)
    }

    // ============================================
    // 7. ЛОГИРОВАНИЕ НА РУССКОМ
    // ============================================
    console.log(
      `[Права] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
      `скопировал ${copiedCount} прав из роли "${fromRole}" в роль "${toRole}". ` +
      `Предыдущее количество прав у "${toRole}": ${previousCount}. ` +
      `Инвалидирован кэш для ${usersWithTargetRole.length} пользователей`
    )

    return {
      from: fromRole,
      to: toRole,
      copiedCount,
      previousCount,
      message: `Скопировано ${copiedCount} прав из роли "${fromRole}" в роль "${toRole}". Кэш обновлён для ${usersWithTargetRole.length} пользователей.`
    }
  } catch (error: any) {
    console.error(
      `[Права] ❌ Ошибка копирования прав из "${fromRole}" в "${toRole}":`,
      error
    )
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при копировании прав'
    })
  }
})
