// server/api/permissions/roles/[role]/reset.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/roles/[role]/reset
 *
 * Назначение:
 * - Сбросить права указанной роли к дефолтным значениям из ROLE_PERMISSIONS_SEED
 * - Используется в UI настроек прав (кнопка "Сбросить к дефолтным")
 *
 * ⚠️ Доступ: только для роли admin (двойная проверка — middleware + handler)
 * - Middleware проверяет settings.canSpecial
 * - Handler дополнительно проверяет admin
 *
 * Логика (упрощённая, без canView):
 * 1. Валидация роли из URL (через validateRoleParam — zod enum из shared)
 * 2. Получение дефолтных прав из ROLE_PERMISSIONS_SEED
 * 3. В транзакции: удаление всех текущих прав + создание дефолтных
 * 4. Инвалидация кэша прав для ВСЕХ пользователей этой роли
 * 5. 🆕 Принудительное отключение всех сокетов этой роли
 *    (сброс прав — критичное изменение, пользователи должны войти заново)
 *
 * Почему принудительное отключение?
 * - При сбросе могут отозваться действия на критических страницах (dashboard, objects)
 * - Пользователь не сможет нормально работать со старым кэшем
 * - Безопаснее разорвать соединение с понятной причиной
 *
 * Видимость раздела:
 * - Раздел виден в меню если есть хотя бы одно действие (create/edit/delete/special)
 * - canView упразднён — отдельного флага просмотра нет
 *
 * @param {string} role — роль из пути (admin, manager, foreman, master, worker)
 * @returns { role, roleLabel, resetCount, previousCount, invalidatedUsers, disconnectedUsers, message }
 */
import { defineEventHandler, getRouterParam } from 'h3'
import { eq, sql } from 'drizzle-orm'
import { db } from '../../../../db'
import { users, permissionsRoleAccess } from '../../../../db/schema'
import { validateRoleParam } from '../../../../utils/permissions/validators'
import { invalidatePermissionsCacheByRole, type DbUser } from '../../../../utils/permissions'
import { ROLE_PERMISSIONS_SEED } from '../../../../utils/permissions/seed'
import {
  hasRequiredRoleLevel,
  ROLE_LABELS,
  type Role
} from 'shared/constants/roles'
import { getIO } from '../../../../socket/common'
import { forceDisconnectRole } from '../../../../socket'

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
  // 2. ПРОВЕРКА ПРАВ: ТОЛЬКО АДМИН
  // ============================================
  // Middleware проверил settings.canSpecial, но сброс к дефолтам — критическая операция
  if (!hasRequiredRoleLevel(currentUser.role as Role, 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Сброс прав роли к дефолтным доступен только администратору'
    })
  }

  // ============================================
  // 3. ВАЛИДАЦИЯ РОЛИ ИЗ URL
  // ============================================
  const roleParam = getRouterParam(event, 'role')
  const targetRole: Role = validateRoleParam(roleParam)

  // ============================================
  // 4. ПРОВЕРКА СУЩЕСТВОВАНИЯ ДЕФОЛТНЫХ ПРАВ В SEED
  // ============================================
  const defaultPermissions = ROLE_PERMISSIONS_SEED[targetRole]
  if (!defaultPermissions) {
    throw createError({
      statusCode: 404,
      statusMessage: `Дефолтные права для роли "${ROLE_LABELS[targetRole]}" не найдены в конфигурации`
    })
  }

  const defaultPages = Object.keys(defaultPermissions)
  if (defaultPages.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `У роли "${ROLE_LABELS[targetRole]}" нет настроенных дефолтных прав`
    })
  }

  // ============================================
  // 5. ПОДСЧЁТ ТЕКУЩИХ ПРАВ РОЛИ (для статистики)
  // ============================================
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissionsRoleAccess)
    .where(eq(permissionsRoleAccess.role, targetRole))

  const previousCount = Number(countResult?.count || 0)

  // ============================================
  // 6. СБРОС ПРАВ В ТРАНЗАКЦИИ
  // ============================================
  const resetCount = await db.transaction(async (tx) => {
    // 6.1. Удаляем все текущие права роли
    await tx
      .delete(permissionsRoleAccess)
      .where(eq(permissionsRoleAccess.role, targetRole))

    // 6.2. Создаём дефолтные права из ROLE_PERMISSIONS_SEED
    // ⚠️ canView упразднён — всегда false (для совместимости с БД, но не используется)
    // Видимость определяется наличием любого действия (create/edit/delete/special)
    const insertValues = defaultPages.map(pageSlug => {
      const perms = defaultPermissions[pageSlug] || {}
      return {
        role: targetRole,
        pageSlug,
        canView: perms.canView ?? false,
        canCreate: perms.canCreate ?? false,
        canEdit: perms.canEdit ?? false,
        canDelete: perms.canDelete ?? false,
        canSpecial: perms.canSpecial ?? false,
        comment: `Сброшено к дефолтным значениям администратором ${currentUser.name}`,
        updatedBy: currentUser.id,
        isActive: true
      }
    })

    await tx.insert(permissionsRoleAccess).values(insertValues)
    return defaultPages.length
  })

  // ============================================
  // 7. ИНВАЛИДАЦИЯ КЭША ПРАВ (через утилиту из utils/permissions)
  // ============================================
  const invalidationResult = await invalidatePermissionsCacheByRole(targetRole)

  // ============================================
  // 8. ЛОГИРОВАНИЕ
  // ============================================
  // console.log(
  //   `[Права] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
  //   `сбросил права роли "${ROLE_LABELS[targetRole]}" (${targetRole}) к дефолтным значениям. ` +
  //   `Было: ${previousCount}, стало: ${resetCount}. ` +
  //   `Кэш инвалидирован для ${invalidationResult.invalidated}/${invalidationResult.total} пользователей`
  // )

  // ============================================
  // 9. 🆕 ПРИНУДИТЕЛЬНОЕ ОТКЛЮЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ РОЛИ
  // ============================================
  // Сброс прав — критичное изменение (могут отозваться действия на dashboard/objects).
  // Пользователи должны войти заново, чтобы получить актуальные права.
  const io = getIO()
  let disconnectedUsers = 0

  if (io) {
    disconnectedUsers = forceDisconnectRole(
      io,
      targetRole,
      `Права вашей роли "${ROLE_LABELS[targetRole]}" были сброшены к дефолтным значениям. Необходимо войти в систему заново.`
    )
  }

  // ============================================
  // 10. ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================
  return {
    role: targetRole,
    roleLabel: ROLE_LABELS[targetRole],
    resetCount,
    previousCount,
    invalidatedUsers: invalidationResult.invalidated,
    disconnectedUsers,
    message: `Права роли "${ROLE_LABELS[targetRole]}" сброшены к дефолтным значениям (${resetCount} прав). Кэш обновлён для ${invalidationResult.invalidated} пользователей, ${disconnectedUsers} отключены.`
  }
})

// ============================================
// ЛОКАЛЬНЫЙ ИМПОРТ createError (для совместимости)
// ============================================
import { createError } from 'h3'
