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
import type { Server, Socket } from 'socket.io'
import type { BoardColumn } from '~/types/boards'
import { db, boards, boardColumns } from '../../db'
import { eq, and } from 'drizzle-orm'

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
 * Получить ID доски по ID колонки
 * @param columnId - ID колонки
 * @returns ID доски или null
 */
async function getBoardIdByColumnId(columnId: number): Promise<number | null> {
  try {
    const [column] = await db
      .select({ boardId: boardColumns.boardId })
      .from(boardColumns)
      .where(eq(boardColumns.id, columnId))
    
    return column?.boardId || null
  } catch (error) {
    console.error('[ColumnSocket] ❌ Error getting boardId by columnId:', error)
    return null
  }
}

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
  
  console.log(
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
  
  console.log(
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
  
  console.log(
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
  
  console.log(
    `[ColumnSocket] 📋 Columns reordered: ${columns.length} columns | Board: ${boardId} | Room: ${roomName}`
  )
}

// ============================================
// РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ
// ============================================
/**
 * Зарегистрировать все обработчики событий для колонок
 * @param io - Экземпляр Socket.IO сервера
 */
export function registerColumnHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id || 'unknown'
    
    console.log(`[ColumnSocket] 🔌 User ${userId} connected (socket: ${socket.id})`)
    
    // ============================================
    // ПОДПИСКА НА КОМНАТУ ДОСКИ
    // ============================================
    socket.on('join', async (roomName: string) => {
      try {
        // Проверяем формат комнаты (должен быть board:{boardId})
        if (!roomName.startsWith(BOARD_ROOM_PREFIX)) {
          console.warn(`[ColumnSocket] ⚠️ Invalid room format: ${roomName}`)
          return
        }
        
        const boardId = parseInt(roomName.replace(BOARD_ROOM_PREFIX, ''), 10)
        if (isNaN(boardId)) {
          console.warn(`[ColumnSocket] ⚠️ Invalid boardId in room: ${roomName}`)
          return
        }
        
        // Проверяем существование доски
        const [board] = await db
          .select({ id: boards.id })
          .from(boards)
          .where(eq(boards.id, boardId))
          .limit(1)
        
        // Даже если доска пустая, разрешаем подписку
        await socket.join(roomName)
        
        const rooms = Array.from(socket.rooms)
        console.log(
          `[ColumnSocket] ✅ User ${userId} joined room: ${roomName} | Total rooms: ${rooms.length}`
        )
        
        // Отправляем подтверждение клиенту
        socket.emit('board:subscribed', {
          boardId,
          success: true,
          room: roomName
        })
      } catch (error) {
        console.error(`[ColumnSocket] ❌ Error joining room ${roomName}:`, error)
        socket.emit('board:subscribe_error', {
          room: roomName,
          message: 'Ошибка подписки на доску'
        })
      }
    })
    
    // ============================================
    // ОТПИСКА ОТ КОМНАТЫ ДОСКИ
    // ============================================
    socket.on('leave', async (roomName: string) => {
      try {
        if (!roomName.startsWith(BOARD_ROOM_PREFIX)) {
          console.warn(`[ColumnSocket] ⚠️ Invalid room format: ${roomName}`)
          return
        }
        
        await socket.leave(roomName)
        
        const rooms = Array.from(socket.rooms)
        console.log(
          `[ColumnSocket] 📴 User ${userId} left room: ${roomName} | Remaining rooms: ${rooms.length}`
        )
        
        // Отправляем подтверждение клиенту
        socket.emit('board:unsubscribed', {
          room: roomName,
          success: true
        })
      } catch (error) {
        console.error(`[ColumnSocket] ❌ Error leaving room ${roomName}:`, error)
      }
    })
    
    // ============================================
    // ЗАПРОС СПИСКА КОМНАТ (ДЛЯ ОТЛАДКИ)
    // ============================================
    socket.on('debug:rooms', () => {
      const rooms = Array.from(socket.rooms)
      console.log(`[ColumnSocket] 🔍 Debug: User ${userId} rooms:`, rooms)
      socket.emit('debug:rooms', { rooms })
    })
    
    // ============================================
    // ОБРАБОТКА ОТКЛЮЧЕНИЯ
    // ============================================
    socket.on('disconnect', (reason) => {
      console.log(
        `[ColumnSocket] 👋 User ${userId} disconnected | Reason: ${reason}`
      )
      // Socket.IO автоматически удаляет пользователя из всех комнат
      // Дополнительная очистка не требуется
    })
    
    // ============================================
    // ОБРАБОТКА ОШИБОК
    // ============================================
    socket.on('error', (error: any) => {
      console.error(`[ColumnSocket] ❌ Socket error for user ${userId}:`, error)
    })
  })
  
  console.log('[ColumnSocket] ✅ Column handlers registered successfully')
}

// ============================================
// УТИЛИТЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В API ENDPOINTS
// ============================================
/**
 * Получить и отправить данные колонки после создания
 * @param io - Экземпляр Socket.IO сервера
 * @param columnId - ID созданной колонки
 */
export async function handleColumnCreatedEvent(
  io: Server,
  columnId: number
): Promise<void> {
  try {
    // Получаем созданную колонку
    const [column] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, columnId))
    
    if (!column) {
      console.error(`[ColumnSocket] ❌ Column ${columnId} not found after creation`)
      return
    }
    
    // Получаем ID доски
    const boardId = column.boardId
    
    // Конвертируем даты в строки для клиента
    const columnForClient: BoardColumn = {
      ...column,
      createdAt: column.createdAt 
        ? new Date(column.createdAt).toISOString() 
        : new Date().toISOString(),
      updatedAt: column.updatedAt 
        ? new Date(column.updatedAt).toISOString() 
        : new Date().toISOString()
    }
    
    // Отправляем событие
    broadcastColumnCreated(io, columnForClient, boardId)
  } catch (error) {
    console.error('[ColumnSocket] ❌ Error handling column created event:', error)
  }
}

/**
 * Получить и отправить данные колонки после обновления
 * @param io - Экземпляр Socket.IO сервера
 * @param columnId - ID обновлённой колонки
 */
export async function handleColumnUpdatedEvent(
  io: Server,
  columnId: number
): Promise<void> {
  try {
    // Получаем обновлённую колонку
    const [column] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, columnId))
    
    if (!column) {
      console.error(`[ColumnSocket] ❌ Column ${columnId} not found after update`)
      return
    }
    
    // Получаем ID доски
    const boardId = column.boardId
    
    // Конвертируем даты в строки для клиента
    const columnForClient: BoardColumn = {
      ...column,
      createdAt: column.createdAt 
        ? new Date(column.createdAt).toISOString() 
        : new Date().toISOString(),
      updatedAt: column.updatedAt 
        ? new Date(column.updatedAt).toISOString() 
        : new Date().toISOString()
    }
    
    // Отправляем событие
    broadcastColumnUpdated(io, columnForClient, boardId)
  } catch (error) {
    console.error('[ColumnSocket] ❌ Error handling column updated event:', error)
  }
}

/**
 * Отправить событие удаления колонки
 * @param io - Экземпляр Socket.IO сервера
 * @param columnId - ID удалённой колонки
 */
export async function handleColumnDeletedEvent(
  io: Server,
  columnId: number
): Promise<void> {
  try {
    // Получаем ID доски
    const boardId = await getBoardIdByColumnId(columnId)
    
    if (!boardId) {
      console.error(`[ColumnSocket] ❌ Board not found for column ${columnId}`)
      return
    }
    
    // Отправляем событие
    broadcastColumnDeleted(io, columnId, boardId)
  } catch (error) {
    console.error('[ColumnSocket] ❌ Error handling column deleted event:', error)
  }
}
