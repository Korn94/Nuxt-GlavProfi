// server/api/permissions/roles/copy.post.ts
/**
 * 📍 Эндпоинт: POST /api/permissions/roles/copy
 *
 * Назначение:
 * - Скопировать все права доступа из одной роли в другую
 * - Существующие права целевой роли будут **полностью заменены**
 *
 * ⚠️ Доступ: только для роли admin (двойная проверка — middleware + handler)
 * - Middleware проверяет settings.canSpecial
 * - Handler дополнительно проверяет admin
 *
 * Логика:
 * 1. Валидация body через zod (from и to — разные валидные роли)
 * 2. Получение всех активных прав из исходной роли
 * 3. В транзакции: удаление всех прав целевой роли + создание новых
 * 4. Инвалидация кэша для ВСЕХ пользователей целевой роли
 * 5. 🆕 Принудительное отключение сокетов целевой роли
 *    (копирование = критичное изменение, как и сброс)
 *
 * Модель прав (без canView):
 * - Видимость раздела определяется наличием любого действия
 * - canView упразднён — всегда false при копировании (для совместимости с БД)
 *
 * Почему принудительное отключение?
 * - Копирование полностью заменяет права целевой роли
 * - Могут отозваться действия на критических страницах
 * - Пользователи должны войти заново для получения актуальных прав
 *
 * @body { from: Role, to: Role }
 * @returns { from, to, fromLabel, toLabel, copiedCount, previousCount, invalidatedUsers, disconnectedUsers, message }
 */
import { defineEventHandler, readBody, createError } from 'h3'
import { eq, sql, and } from 'drizzle-orm'
import { db } from '../../../db'
import { users, permissionsRoleAccess } from '../../../db/schema'
import { validateCopyRolePermissions } from '../../../utils/permissions/validators'
import { invalidatePermissionsCacheByRole, type DbUser } from '../../../utils/permissions'
import {
  hasRequiredRoleLevel,
  ROLE_LABELS,
  type Role
} from 'shared/constants/roles'
import { getIO } from '../../../socket/common'
import { forceDisconnectRole } from '../../../socket'

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
  // Middleware проверил settings.canSpecial, но копирование — критическая операция
  if (!hasRequiredRoleLevel(currentUser.role as Role, 'admin')) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Копирование прав между ролями доступно только администратору'
    })
  }

  // ============================================
  // 3. ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА (через zod)
  // ============================================
  const body = await readBody(event)
  const validated = validateCopyRolePermissions(body)
  const { from: fromRole, to: toRole } = validated

  // ============================================
  // 4. ПОЛУЧЕНИЕ ПРАВ ИСХОДНОЙ РОЛИ
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
        eq(permissionsRoleAccess.role, fromRole as any),
        eq(permissionsRoleAccess.isActive, true)
      )
    )

  if (sourcePermissions.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `У роли "${ROLE_LABELS[fromRole as Role]}" нет настроенных прав для копирования`
    })
  }

  // ============================================
  // 5. ПОДСЧЁТ ТЕКУЩИХ ПРАВ ЦЕЛЕВОЙ РОЛИ (для статистики)
  // ============================================
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissionsRoleAccess)
    .where(eq(permissionsRoleAccess.role, toRole as any))

  const previousCount = Number(countResult?.count || 0)

  // ============================================
  // 6. КОПИРОВАНИЕ В ТРАНЗАКЦИИ
  // ============================================
  const copiedCount = await db.transaction(async (tx) => {
    // 6.1. Удаляем все существующие права целевой роли
    await tx
      .delete(permissionsRoleAccess)
      .where(eq(permissionsRoleAccess.role, toRole as any))

    // 6.2. Создаём новые права на основе исходных
    // ⚠️ canView упразднён — всегда false (для совместимости с БД, но не используется)
    // Видимость определяется наличием любого действия (create/edit/delete/special)
    await tx.insert(permissionsRoleAccess).values(
      sourcePermissions.map(p => ({
        role: toRole,
        pageSlug: p.pageSlug,
        canView: p.canView,
        canCreate: p.canCreate,
        canEdit: p.canEdit,
        canDelete: p.canDelete,
        canSpecial: p.canSpecial,
        comment: `Скопировано из роли "${fromRole}" администратором ${currentUser.name}`,
        updatedBy: currentUser.id,
        isActive: true
      }))
    )

    return sourcePermissions.length
  })

  // ============================================
  // 7. ИНВАЛИДАЦИЯ КЭША ПРАВ (через утилиту из utils/permissions)
  // ============================================
  const invalidationResult = await invalidatePermissionsCacheByRole(toRole as Role)

  // ============================================
  // 8. ЛОГИРОВАНИЕ
  // ============================================
  console.log(
    `[Права] ✅ Администратор ${currentUser.name} (ID: ${currentUser.id}) ` +
    `скопировал ${copiedCount} прав из роли "${ROLE_LABELS[fromRole as Role]}" (${fromRole}) ` +
    `в роль "${ROLE_LABELS[toRole as Role]}" (${toRole}). ` +
    `Было: ${previousCount}, стало: ${copiedCount}. ` +
    `Кэш инвалидирован для ${invalidationResult.invalidated}/${invalidationResult.total} пользователей`
  )

  // ============================================
  // 9. 🆕 ПРИНУДИТЕЛЬНОЕ ОТКЛЮЧЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ ЦЕЛЕВОЙ РОЛИ
  // ============================================
  // Копирование полностью заменяет права — это критичное изменение.
  // Могут отозваться действия на dashboard/objects/works.
  const io = getIO()
  let disconnectedUsers = 0

  if (io) {
    disconnectedUsers = forceDisconnectRole(
      io,
      toRole,
      `Права вашей роли "${ROLE_LABELS[toRole as Role]}" были заменены копированием из роли "${ROLE_LABELS[fromRole as Role]}". Необходимо войти в систему заново.`
    )
  }

  // ============================================
  // 10. ВОЗВРАТ РЕЗУЛЬТАТА
  // ============================================
  return {
    from: fromRole,
    to: toRole,
    fromLabel: ROLE_LABELS[fromRole as Role],
    toLabel: ROLE_LABELS[toRole as Role],
    copiedCount,
    previousCount,
    invalidatedUsers: invalidationResult.invalidated,
    disconnectedUsers,
    message: `Скопировано ${copiedCount} прав из роли "${ROLE_LABELS[fromRole as Role]}" в роль "${ROLE_LABELS[toRole as Role]}". Кэш обновлён для ${invalidationResult.invalidated} пользователей, ${disconnectedUsers} отключены.`
  }
})
