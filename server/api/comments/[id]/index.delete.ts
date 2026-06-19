// server/api/comments/[id]/index.delete.ts
/**
 * 📍 Файл: `server/api/comments/[id]/index.delete.ts`
 * 📍 Эндпоинт: `DELETE /api/comments/[id]`
 *
 * Назначение: Удаление комментария (с каскадным удалением ответов)
 * ⚠️ Middleware уже проверил canDelete через PROTECTED_PATHS (dashboard.canDelete)
 * ⚠️ Дополнительная бизнес-логика: только admin ИЛИ автор комментария
 *
 * @param {string} id — ID комментария (из пути)
 * @returns { success: boolean, message: string }
 */
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { boardsComments } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import type { DbUser } from '../../../utils/permissions'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и базовые права уже проверены мидлваром
  const currentUser = event.context.user as DbUser
  if (!currentUser) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Не удалось получить данные текущего пользователя'
    })
  }

  // ============================================
  // 1. ПОЛУЧЕНИЕ ID КОММЕНТАРИЯ
  // ============================================
  const idParam = getRouterParam(event, 'id')
  if (!idParam || isNaN(Number(idParam))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный ID комментария'
    })
  }
  const commentId = Number(idParam)

  // ============================================
  // 2. ПРОВЕРКА СУЩЕСТВОВАНИЯ КОММЕНТАРИЯ
  // ============================================
  const [existingComment] = await db
    .select()
    .from(boardsComments)
    .where(eq(boardsComments.id, commentId))

  if (!existingComment) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Комментарий не найден'
    })
  }

  // ============================================
  // 3. ПРОВЕРКА ПРАВ НА УДАЛЕНИЕ
  // ============================================
  // Разрешаем удалять админам и авторам комментария
  if (currentUser.role !== 'admin' && existingComment.userId !== currentUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'У вас нет прав на удаление этого комментария'
    })
  }

  // ============================================
  // 4. УДАЛЕНИЕ КОММЕНТАРИЯ
  // ============================================
  try {
    // Удаляем комментарий (каскадное удаление удалит все ответы)
    await db
      .delete(boardsComments)
      .where(eq(boardsComments.id, commentId))

    console.log(
      `[Comments] 🗑️ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `удалил комментарий ID: ${commentId}`
    )

    return {
      success: true,
      message: 'Комментарий успешно удалён'
    }
  } catch (error: any) {
    console.error('[Comments] ❌ Ошибка удаления комментария:', error)

    // Пробрасываем HTTP-ошибки как есть
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при удалении комментария'
    })
  }
})
