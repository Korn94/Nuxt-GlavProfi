// server/api/comments/[id]/index.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db, boardsComments } from '../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID комментария из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID комментария'
      })
    }

    const commentId = Number(id)

    // Проверяем, существует ли комментарий
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

    // Проверяем, что пользователь является автором комментария
    if (existingComment.userId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'У вас нет прав на редактирование этого комментария'
      })
    }

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидация текста комментария
    if (!body.comment || typeof body.comment !== 'string' || body.comment.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Текст комментария не может быть пустым'
      })
    }

    // Обновляем комментарий
    await db
      .update(boardsComments)
      .set({
        comment: body.comment.trim()
      })
      .where(eq(boardsComments.id, commentId))

    // Получаем обновлённый комментарий
    const [updatedComment] = await db
      .select()
      .from(boardsComments)
      .where(eq(boardsComments.id, commentId))

    return {
      success: true,
      comment: updatedComment
    }
  } catch (error) {
    console.error('Error updating comment:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update comment'
    })
  }
})
