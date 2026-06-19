// server/api/comments/[id]/index.put.ts
/**
 * 📍 Файл: `server/api/comments/[id]/index.put.ts`
 * 📍 Эндпоинт: `PUT /api/comments/[id]`
 *
 * Назначение: Редактирование текста комментария
 * ⚠️ Middleware уже проверил canEdit через PROTECTED_PATHS (dashboard.canEdit)
 * ⚠️ Дополнительная бизнес-логика: только автор комментария может его редактировать
 *
 * @param {string} id — ID комментария (из пути)
 * @body { comment: string } — новый текст комментария
 * @returns { success: boolean, comment: BoardComment }
 */
import { defineEventHandler, createError, readBody, getRouterParam } from 'h3'
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
  // 3. ПРОВЕРКА ПРАВ НА РЕДАКТИРОВАНИЕ
  // ============================================
  // Только автор комментария может его редактировать (админы не могут редактировать чужие)
  if (existingComment.userId !== currentUser.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Вы можете редактировать только свои комментарии'
    })
  }

  // ============================================
  // 4. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody(event)

  if (!body.comment || typeof body.comment !== 'string' || body.comment.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Текст комментария не может быть пустым'
    })
  }

  // ============================================
  // 5. ОБНОВЛЕНИЕ КОММЕНТАРИЯ
  // ============================================
  try {
    await db
      .update(boardsComments)
      .set({
        comment: body.comment.trim(),
        updatedAt: new Date()
      })
      .where(eq(boardsComments.id, commentId))

    // Получаем обновлённый комментарий для возврата
    const [updatedComment] = await db
      .select()
      .from(boardsComments)
      .where(eq(boardsComments.id, commentId))

    console.log(
      `[Comments] ✏️ Пользователь ${currentUser.name} (ID: ${currentUser.id}) ` +
      `отредактировал комментарий ID: ${commentId}`
    )

    return {
      success: true,
      comment: updatedComment
    }
  } catch (error: any) {
    console.error('[Comments] ❌ Ошибка редактирования комментария:', error)

    // Пробрасываем HTTP-ошибки как есть
    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при редактировании комментария'
    })
  }
})
