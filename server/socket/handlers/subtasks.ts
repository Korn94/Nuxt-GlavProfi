// server/socket/handlers/subtasks.ts
import { Server } from 'socket.io'
import type { Subtask } from '~/types/boards'

/**
 * Обработчик создания подзадачи
 */
export function handleSubtaskCreate(
  io: Server,
  subtaskId: number,
  subtask: Subtask,
  taskId: number
) {
  const roomName = `task:${taskId}`
  io.to(roomName).emit(`task:${taskId}:subtask:created`, { subtask })
  console.log(`[Socket] ✅ Subtask ${subtaskId} created on task ${taskId}`)
}

/**
 * Обработчик обновления подзадачи
 */
export function handleSubtaskUpdate(
  io: Server,
  subtaskId: number,
  subtask: Subtask,
  taskId: number
) {
  const roomName = `task:${taskId}`
  io.to(roomName).emit(`task:${taskId}:subtask:updated`, { subtaskId, subtask })
  console.log(`[Socket] ✅ Subtask ${subtaskId} updated on task ${taskId}`)
}

/**
 * Обработчик удаления подзадачи
 */
export function handleSubtaskDelete(
  io: Server,
  subtaskId: number,
  taskId: number
) {
  const roomName = `task:${taskId}`
  io.to(roomName).emit(`task:${taskId}:subtask:deleted`, { subtaskId })
  console.log(`[Socket] ✅ Subtask ${subtaskId} deleted on task ${taskId}`)
}

/**
 * Регистрация обработчиков подзадач
 */
export function registerSubtaskHandlers(io: Server) {
  console.log('[Socket] ✅ Subtask handlers registered')
}
