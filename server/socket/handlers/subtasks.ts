// server/socket/handlers/subtasks.ts
import type { Server } from 'socket.io'
import type { Subtask } from '~/types/boards'

/**
 * Отправка события о создании подзадачи
 */
export function handleSubtaskCreate(
  io: Server,
  subtaskId: number,
  subtask: Subtask,
  taskId: number
) {
  const boardId = getBoardIdFromTaskId(taskId)
  
  // ✅ Отправляем всем подключенным к задаче
  io.to(`task:${taskId}`).emit(`task:${taskId}:subtask:created`, {
    subtaskId,
    subtask,
    taskId
  })
  
  console.log(`[Socket] 🆕 Subtask ${subtaskId} created for task ${taskId}`)
}

/**
 * Отправка события об обновлении подзадачи
 */
export function handleSubtaskUpdate(
  io: Server,
  subtaskId: number,
  subtask: Subtask,
  taskId: number
) {
  const boardId = getBoardIdFromTaskId(taskId)
  
  io.to(`task:${taskId}`).emit(`task:${taskId}:subtask:updated`, {
    subtaskId,
    subtask,
    taskId
  })
  
  if (boardId) {
    io.to(`board:${boardId}`).emit(`board:${boardId}:subtask:updated`, {
      subtaskId,
      subtask,
      taskId
    })
  }
  
  console.log(`[Socket] 🔄 Subtask ${subtaskId} updated for task ${taskId}`)
}

/**
 * Отправка события об удалении подзадачи
 */
export function handleSubtaskDelete(
  io: Server,
  subtaskId: number,
  taskId: number
) {
  const boardId = getBoardIdFromTaskId(taskId)
  
  io.to(`task:${taskId}`).emit(`task:${taskId}:subtask:deleted`, {
    subtaskId,
    taskId
  })
  
  if (boardId) {
    io.to(`board:${boardId}`).emit(`board:${boardId}:subtask:deleted`, {
      subtaskId,
      taskId
    })
  }
  
  console.log(`[Socket] 🗑️ Subtask ${subtaskId} deleted for task ${taskId}`)
}

/**
 * Вспомогательная функция для получения boardId по taskId
 * TODO: Заменить на реальный запрос к БД или кэш
 */
async function getBoardIdFromTaskId(taskId: number): Promise<number | null> {
  // ✅ В продакшене нужно делать запрос к БД
  // const [task] = await db.select({ boardId: boardsTasks.boardId })
  //   .from(boardsTasks)
  //   .where(eq(boardsTasks.id, taskId))
  // return task?.boardId || null
  
  // ✅ Временно возвращаем null - события идут через task:${taskId}
  return null
}
