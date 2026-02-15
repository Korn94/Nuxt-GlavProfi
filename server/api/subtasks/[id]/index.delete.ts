// server/api/subtasks/[id]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db, boardsSubtasks } from '../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'
import { handleSubtaskDelete } from '../../../socket/handlers/subtasks'
import { getIO } from '../../../plugins/socket.io'

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
    
    // ✅ ПОЛУЧАЕМ ПОДЗАДАЧУ ДО УДАЛЕНИЯ ДЛЯ СОКЕТА
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
    
    // ✅ СОХРАНЯЕМ ДАННЫЕ ДЛЯ СОКЕТА
    const taskId = existingSubtask.taskId
    
    // Удаляем подзадачу (каскадное удаление удалит все дочерние подзадачи)
    await db
      .delete(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
    
    // ✅ ОТПРАВЛЯЕМ СОКЕТ-СОБЫТИЕ
    const io = getIO()
    if (io) {
      handleSubtaskDelete(io, subtaskId, taskId)
    }
    
    return {
      success: true,
      message: 'Подзадача успешно удалена'
    }
  } catch (error) {
    console.error('Error deleting subtask:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete subtask'
    })
  }
})
