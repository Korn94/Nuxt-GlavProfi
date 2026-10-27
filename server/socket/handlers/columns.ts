// server/socket/handlers/columns.ts

/**
 * Обработчики Socket.IO событий для колонок доски
 *
 * Архитектура:
 * - Все события отправляются в комнату доски (board:{boardId})
 * - Все пользователи в комнате видят изменения мгновенно
 * - Поддержка создания, обновления, удаления и переупорядочивания колонок
 * - Типизированные события для клиента
 */
import type { Server } from 'socket.io'
import type { BoardColumn } from '~/types/boards'
import { socketLog } from '../logger'

// ============================================
// ТИПЫ СОБЫТИЙ
// ============================================
/**
 * Данные события создания колонки
 */
export interface ColumnCreatedData {
  column: BoardColumn
  boardId: number
}

/**
 * Данные события обновления колонки
 */
export interface ColumnUpdatedData {
  column: BoardColumn
  boardId: number
}

/**
 * Данные события удаления колонки
 */
export interface ColumnDeletedData {
  columnId: number
  boardId: number
}

/**
 * Данные события изменения порядка колонок
 */
export interface ColumnsReorderedData {
  boardId: number
  columns: Array<{ id: number; order: number }>
}

// ============================================
// КОНСТАНТЫ
// ============================================
/**
 * Префикс комнаты доски
 */
const BOARD_ROOM_PREFIX = 'board:'

/**
 * Префикс событий колонок
 */
const COLUMN_EVENT_PREFIX = 'board:column:'

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
// ЭМИТТЕРЫ СОБЫТИЙ (для API endpoints)
// ============================================
/**
 * Отправить событие создания колонки всем пользователям в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param column - Данные колонки
 * @param boardId - ID доски
 */
export function broadcastColumnCreated(
  io: Server,
  column: BoardColumn,
  boardId: number
): void {
  const roomName = getBoardRoomName(boardId)
  const eventData: ColumnCreatedData = {
    column,
    boardId
  }
  
  io.to(roomName).emit(`${COLUMN_EVENT_PREFIX}created`, eventData)
  
  socketLog(
    `[ColumnSocket] 🆕 Column created: ${column.id} | Board: ${boardId} | Room: ${roomName}`
  )
}

/**
 * Отправить событие обновления колонки всем пользователям в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param column - Данные колонки
 * @param boardId - ID доски
 */
export function broadcastColumnUpdated(
  io: Server,
  column: BoardColumn,
  boardId: number
): void {
  const roomName = getBoardRoomName(boardId)
  const eventData: ColumnUpdatedData = {
    column,
    boardId
  }
  
  io.to(roomName).emit(`${COLUMN_EVENT_PREFIX}updated`, eventData)
  
  socketLog(
    `[ColumnSocket] 🔄 Column updated: ${column.id} | Board: ${boardId} | Room: ${roomName}`
  )
}

/**
 * Отправить событие удаления колонки всем пользователям в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param columnId - ID колонки
 * @param boardId - ID доски
 */
export function broadcastColumnDeleted(
  io: Server,
  columnId: number,
  boardId: number
): void {
  const roomName = getBoardRoomName(boardId)
  const eventData: ColumnDeletedData = {
    columnId,
    boardId
  }
  
  io.to(roomName).emit(`${COLUMN_EVENT_PREFIX}deleted`, eventData)
  
  socketLog(
    `[ColumnSocket] 🗑️ Column deleted: ${columnId} | Board: ${boardId} | Room: ${roomName}`
  )
}

/**
 * Отправить событие изменения порядка колонок всем пользователям в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param boardId - ID доски
 * @param columns - Массив колонок с новым порядком
 */
export function broadcastColumnsReordered(
  io: Server,
  boardId: number,
  columns: Array<{ id: number; order: number }>
): void {
  const roomName = getBoardRoomName(boardId)
  const eventData: ColumnsReorderedData = {
    boardId,
    columns
  }
  
  io.to(roomName).emit(`${COLUMN_EVENT_PREFIX}reordered`, eventData)
  
  socketLog(
    `[ColumnSocket] 📋 Columns reordered: ${columns.length} columns | Board: ${boardId} | Room: ${roomName}`
  )
}
