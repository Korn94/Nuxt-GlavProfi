// server/api/boards/[id]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boards, boardsTasks, boardsSubtasks, boardsComments, boardsAttachments, boardsActivityLog } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }

    const boardId = Number(id)

    // Проверяем, существует ли доска
    const [existingBoard] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))

    if (!existingBoard) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Доска не найдена'
      })
    }

    // Удаляем доску (каскадное удаление удалит все связанные задачи, подзадачи и т.д.)
    await db
      .delete(boards)
      .where(eq(boards.id, boardId))

    return {
      success: true,
      message: 'Доска успешно удалена'
    }
  } catch (error) {
    console.error('Error deleting board:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete board'
    })
  }
})
