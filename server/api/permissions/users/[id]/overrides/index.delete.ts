// server/api/permissions/users/[id]/overrides/index.delete.ts
/**
 * 📍 Эндпоинт: DELETE /api/permissions/users/[id]/overrides
 *
 * Назначение:
 * Удалить ВСЕ переопределения прав для конкретного пользователя
 * После удаления пользователь будет использовать только базовые права своей роли
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Переопределения для admin может удалять только admin
 *
 * @param {string} id — ID пользователя из пути
 * @returns { userId, userName, deletedCount, message }
 *
 * Пример ответа:
 * {
 *   "userId": 5,
 *   "userName": "Иван Петров",
 *   "deletedCount": 3,
 *   "message": "Удалено 3 переопределений. Кэш обновлён."
 * }
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../../db'
import { users, permissionsUserOverrides } from '../../../../../db/schema'
import { eq, sql } from 'drizzle-orm'
import { invalidatePermissionsCache } from '../../../../../middleware/auth'
import type { DbUser } from '../../../../../utils/permissions'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ПОЛУЧЕНИЕ ID ПОЛЬЗОВАТЕЛЯ ИЗ URL
  // ============================================
  const idParam = getRouterParam(event, 'id')
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID пользователя не указан в URL' })
  }
  const targetUserId = parseInt(idParam, 10)
  if (isNaN(targetUserId)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный формат ID' })
  }

  // ============================================
  // 2. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЦЕЛЕВОГО ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const [targetUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)

  if (!targetUser) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден' })
  }

  // ============================================
  // 3. ЗАЩИТА ОТ ИЗМЕНЕНИЯ ПРАВ АДМИНА НЕ-АДМИНОМ
  // ============================================
  if (targetUser.role === 'admin' && currentUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Только администратор может изменять права администратора'
    })
  }

  // ============================================
  // 4. ПОДСЧЁТ КОЛИЧЕСТВА ПЕРЕОПРЕДЕЛЕНИЙ ПЕРЕД УДАЛЕНИЕМ
  // ============================================
  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(permissionsUserOverrides)
    .where(eq(permissionsUserOverrides.userId, targetUserId))
  const existingCount = Number(countResult?.count || 0)

  if (existingCount === 0) {
    console.log(
      `[Права] ℹ️ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `пытался удалить переопределения для "${targetUser.name}" (ID: ${targetUserId}), но их не было`
    )
    return {
      userId: targetUserId,
      userName: targetUser.name,
      deletedCount: 0,
      message: 'Переопределений не найдено'
    }
  }

  // ============================================
  // 5. УДАЛЕНИЕ ВСЕХ ПЕРЕОПРЕДЕЛЕНИЙ
  // ============================================
  try {
    await db
      .delete(permissionsUserOverrides)
      .where(eq(permissionsUserOverrides.userId, targetUserId))

    // ============================================
    // 6. ИНВАЛИДАЦИЯ КЭША ПРАВ ПОЛЬЗОВАТЕЛЯ
    // ============================================
    invalidatePermissionsCache(targetUserId)

    console.log(
      `[Права] ✅ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `удалил ${existingCount} переопределений для "${targetUser.name}" (ID: ${targetUserId}). ` +
      `Кэш инвалидирован.`
    )

    return {
      userId: targetUserId,
      userName: targetUser.name,
      deletedCount: existingCount,
      message: `Удалено ${existingCount} переопределений. Кэш обновлён.`
    }
  } catch (error: any) {
    console.error(
      `[Права] ❌ Ошибка удаления всех переопределений для пользователя ID=${targetUserId}:`,
      error
    )
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при удалении переопределений'
    })
  }
})
