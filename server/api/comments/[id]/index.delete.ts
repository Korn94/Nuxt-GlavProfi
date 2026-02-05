// server/api/comments/[id]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardsComments } from '../../../db/schema'
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

    // Проверяем права на удаление
    // Разрешаем удалять админам и авторам комментария
    if (user.role !== 'admin' && existingComment.userId !== user.id) {
      throw createError({
        statusCode: 403,
        statusMessage: 'У вас нет прав на удаление этого комментария'
      })
    }

    // Удаляем комментарий (каскадное удаление удалит все ответы)
    await db
      .delete(boardsComments)
      .where(eq(boardsComments.id, commentId))

    return {
      success: true,
      message: 'Комментарий успешно удалён'
    }
  } catch (error) {
    console.error('Error deleting comment:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete comment'
    })
  }
})
