// server/socket/handlers/subtasks.ts
/**
 * Обработчики Socket.IO событий для подзадач
 * 
 * Архитектура:
 * - Все события отправляются в комнату доски (board:{boardId})
 * - Все пользователи в комнате видят изменения мгновенно
 * - Поддержка многоуровневых подзадач (до 5 уровней)
 * - Типизированные события для клиента
 */

import type { Server } from 'socket.io'
import type { Subtask } from '~/types/boards'
import { socketLog } from '../logger'

// ============================================
// ТИПЫ СОБЫТИЙ
// ============================================

/**
 * Данные события создания подзадачи
 */
export interface SubtaskCreatedData {
  subtask: Subtask
  boardId: number
}

/**
 * Данные события обновления подзадачи
 */
export interface SubtaskUpdatedData {
  subtask: Subtask
  boardId: number
}

/**
 * Данные события удаления подзадачи
 */
export interface SubtaskDeletedData {
  subtaskId: number
  taskId: number
  boardId: number
}

// ============================================
// КОНСТАНТЫ
// ============================================

/**
 * Префикс комнаты доски
 */
const BOARD_ROOM_PREFIX = 'board:'

/**
 * Префикс событий подзадач
 */
const SUBTASK_EVENT_PREFIX = 'board:subtask:'

// ============================================
// ФУНКЦИИ ПОМОЩНИКИ
// ============================================

/**
 * Сформировать имя комнаты доски
 * @param boardId - ID доски
 * @returns Имя комнаты (board:{boardId})
 */
function getBoardRoomName(boardId: number): string {
  return `${BOARD_ROOM_PREFIX}${boardId}`
}

// ============================================
// ЭМИТТЕРЫ СОБЫТИЙ
// ============================================

/**
 * Отправить событие создания подзадачи всем пользователям в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param subtask - Данные подзадачи
 * @param boardId - ID доски
 */
export function emitSubtaskCreated(
  io: Server,
  subtask: Subtask,
  boardId: number
): void {
  const roomName = getBoardRoomName(boardId)
  
  const eventData: SubtaskCreatedData = {
    subtask,
    boardId
  }
  
  io.to(roomName).emit(`${SUBTASK_EVENT_PREFIX}created`, eventData)
  
  socketLog(
    `[SubtaskSocket] 🆕 Subtask created: ${subtask.id} | Task: ${subtask.taskId} | Board: ${boardId} | Room: ${roomName}`
  )
}

/**
 * Отправить событие обновления подзадачи всем пользователям в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param subtask - Данные подзадачи
 * @param boardId - ID доски
 */
export function emitSubtaskUpdated(
  io: Server,
  subtask: Subtask,
  boardId: number
): void {
  const roomName = getBoardRoomName(boardId)
  
  const eventData: SubtaskUpdatedData = {
    subtask,
    boardId
  }
  
  io.to(roomName).emit(`${SUBTASK_EVENT_PREFIX}updated`, eventData)
  
  socketLog(
    `[SubtaskSocket] 🔄 Subtask updated: ${subtask.id} | Task: ${subtask.taskId} | Board: ${boardId} | Room: ${roomName}`
  )
}

/**
 * Отправить событие удаления подзадачи всем пользователям в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param subtaskId - ID подзадачи
 * @param taskId - ID задачи
 * @param boardId - ID доски
 */
export function emitSubtaskDeleted(
  io: Server,
  subtaskId: number,
  taskId: number,
  boardId: number
): void {
  const roomName = getBoardRoomName(boardId)
  
  const eventData: SubtaskDeletedData = {
    subtaskId,
    taskId,
    boardId
  }
  
  io.to(roomName).emit(`${SUBTASK_EVENT_PREFIX}deleted`, eventData)
  
  socketLog(
    `[SubtaskSocket] 🗑️ Subtask deleted: ${subtaskId} | Task: ${taskId} | Board: ${boardId} | Room: ${roomName}`
  )
}
