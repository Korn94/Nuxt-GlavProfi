// server/api/permissions/users/[id]/overrides/[pageSlug].delete.ts
/**
 * 📍 Эндпоинт: DELETE /api/permissions/users/[id]/overrides/[pageSlug]
 *
 * Назначение:
 * Удалить переопределение прав для конкретной страницы у пользователя
 * После удаления пользователь будет использовать базовые права своей роли
 *
 * ⚠️ Доступ: middleware уже проверил через PROTECTED_PATHS (settings.canEdit)
 * ⚠️ Переопределения для admin может удалять только admin
 *
 * @param {string} id — ID пользователя из пути
 * @param {string} pageSlug — slug страницы из пути
 * @returns { userId, userName, pageSlug, deleted, message }
 *
 * Пример ответа:
 * {
 *   "userId": 5,
 *   "userName": "Иван Петров",
 *   "pageSlug": "finance",
 *   "deleted": true,
 *   "message": "Переопределение удалено. Кэш обновлён."
 * }
 */
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../../db'
import { users, permissionsUserOverrides } from '../../../../../db/schema'
import { eq, and } from 'drizzle-orm'
import { invalidatePermissionsCache } from '../../../../../middleware/auth'
import type { DbUser } from '../../../../../utils/permissions'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({ statusCode: 401, statusMessage: 'Не удалось получить данные текущего пользователя' })
  }

  // ============================================
  // 1. ПОЛУЧЕНИЕ ПАРАМЕТРОВ ИЗ URL
  // ============================================
  const idParam = getRouterParam(event, 'id')
  const pageSlug = getRouterParam(event, 'pageSlug')
  if (!idParam) {
    throw createError({ statusCode: 400, statusMessage: 'ID пользователя не указан в URL' })
  }
  if (!pageSlug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug страницы не указан в URL' })
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
  // 4. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПЕРЕОПРЕДЕЛЕНИЯ
  // ============================================
  const [existingOverride] = await db
    .select()
    .from(permissionsUserOverrides)
    .where(
      and(
        eq(permissionsUserOverrides.userId, targetUserId),
        eq(permissionsUserOverrides.pageSlug, pageSlug)
      )
    )
    .limit(1)

  if (!existingOverride) {
    // Переопределение не найдено — это не ошибка, просто нечего удалять
    console.log(
      `[Права] ℹ️ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `пытался удалить несуществующее переопределение для пользователя "${targetUser.name}" ` +
      `(ID: ${targetUserId}), страница "${pageSlug}"`
    )
    return {
      userId: targetUserId,
      userName: targetUser.name,
      pageSlug,
      deleted: false,
      message: 'Переопределение не найдено'
    }
  }

  // ============================================
  // 5. УДАЛЕНИЕ ПЕРЕОПРЕДЕЛЕНИЯ
  // ============================================
  try {
    await db
      .delete(permissionsUserOverrides)
      .where(eq(permissionsUserOverrides.id, existingOverride.id))

    // ============================================
    // 6. ИНВАЛИДАЦИЯ КЭША ПРАВ ПОЛЬЗОВАТЕЛЯ
    // ============================================
    invalidatePermissionsCache(targetUserId)

    console.log(
      `[Права] ✅ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `удалил переопределение для пользователя "${targetUser.name}" (ID: ${targetUserId}), ` +
      `страница "${pageSlug}". Кэш инвалидирован.`
    )

    return {
      userId: targetUserId,
      userName: targetUser.name,
      pageSlug,
      deleted: true,
      message: 'Переопределение удалено. Кэш обновлён.'
    }
  } catch (error: any) {
    console.error(
      `[Права] ❌ Ошибка удаления переопределения для пользователя ID=${targetUserId}, ` +
      `страница "${pageSlug}":`,
      error
    )
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при удалении переопределения'
    })
  }
})
