// server/api/subtasks/[id]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardsSubtasks } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID подзадачи из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID подзадачи'
      })
    }

    const subtaskId = Number(id)

    // Проверяем, существует ли подзадача
    const [existingSubtask] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))

    if (!existingSubtask) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Подзадача не найдена'
      })
    }

    // Удаляем подзадачу (каскадное удаление удалит все дочерние подзадачи)
    await db
      .delete(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))

    return {
      success: true,
      message: 'Подзадача успешно удалена'
    }
  } catch (error) {
    console.error('Error deleting subtask:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete subtask'
    })
  }
})
