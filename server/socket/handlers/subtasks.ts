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

import type { Server, Socket } from 'socket.io'
import type { Subtask } from '~/types/boards'
import { db, boardsTasks, boardsSubtasks } from '../../db'
import { eq, and } from 'drizzle-orm'

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
 * Получить ID доски по ID задачи
 * @param taskId - ID задачи
 * @returns ID доски или null
 */
async function getBoardIdByTaskId(taskId: number): Promise<number | null> {
  try {
    const [task] = await db
      .select({ boardId: boardsTasks.boardId })
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))
    
    return task?.boardId || null
  } catch (error) {
    console.error('[SubtaskSocket] ❌ Error getting boardId by taskId:', error)
    return null
  }
}

/**
 * Получить ID доски по ID подзадачи
 * @param subtaskId - ID подзадачи
 * @returns ID доски или null
 */
async function getBoardIdBySubtaskId(subtaskId: number): Promise<number | null> {
  try {
    const [subtask] = await db
      .select({ taskId: boardsSubtasks.taskId })
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
    
    if (!subtask?.taskId) {
      return null
    }
    
    return await getBoardIdByTaskId(subtask.taskId)
  } catch (error) {
    console.error('[SubtaskSocket] ❌ Error getting boardId by subtaskId:', error)
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
  
  console.log(
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
  
  console.log(
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
  
  console.log(
    `[SubtaskSocket] 🗑️ Subtask deleted: ${subtaskId} | Task: ${taskId} | Board: ${boardId} | Room: ${roomName}`
  )
}

// ============================================
// РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ
// ============================================

/**
 * Зарегистрировать все обработчики событий для подзадач
 * @param io - Экземпляр Socket.IO сервера
 */
export function registerSubtaskHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).user?.id || 'unknown'
    
    console.log(`[SubtaskSocket] 🔌 User ${userId} connected (socket: ${socket.id})`)
    
    // ============================================
    // ПОДПИСКА НА КОМНАТУ ДОСКИ
    // ============================================
    
    socket.on('join', async (roomName: string) => {
      try {
        // Проверяем формат комнаты (должен быть board:{boardId})
        if (!roomName.startsWith(BOARD_ROOM_PREFIX)) {
          console.warn(`[SubtaskSocket] ⚠️ Invalid room format: ${roomName}`)
          return
        }
        
        const boardId = parseInt(roomName.replace(BOARD_ROOM_PREFIX, ''), 10)
        
        if (isNaN(boardId)) {
          console.warn(`[SubtaskSocket] ⚠️ Invalid boardId in room: ${roomName}`)
          return
        }
        
        // Проверяем существование доски
        const [board] = await db
          .select({ id: boardsTasks.id })
          .from(boardsTasks)
          .where(eq(boardsTasks.boardId, boardId))
          .limit(1)
        
        // Даже если задач нет, разрешаем подписку (доска может быть пустой)
        
        await socket.join(roomName)
        
        const rooms = Array.from(socket.rooms)
        console.log(
          `[SubtaskSocket] ✅ User ${userId} joined room: ${roomName} | Total rooms: ${rooms.length}`
        )
        
        // Отправляем подтверждение клиенту
        socket.emit('board:subscribed', {
          boardId,
          success: true,
          room: roomName
        })
      } catch (error) {
        console.error(`[SubtaskSocket] ❌ Error joining room ${roomName}:`, error)
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
          console.warn(`[SubtaskSocket] ⚠️ Invalid room format: ${roomName}`)
          return
        }
        
        await socket.leave(roomName)
        
        const rooms = Array.from(socket.rooms)
        console.log(
          `[SubtaskSocket] 📴 User ${userId} left room: ${roomName} | Remaining rooms: ${rooms.length}`
        )
        
        // Отправляем подтверждение клиенту
        socket.emit('board:unsubscribed', {
          room: roomName,
          success: true
        })
      } catch (error) {
        console.error(`[SubtaskSocket] ❌ Error leaving room ${roomName}:`, error)
      }
    })
    
    // ============================================
    // ЗАПРОС СПИСКА КОМНАТ (ДЛЯ ОТЛАДКИ)
    // ============================================
    
    socket.on('debug:rooms', () => {
      const rooms = Array.from(socket.rooms)
      console.log(`[SubtaskSocket] 🔍 Debug: User ${userId} rooms:`, rooms)
      socket.emit('debug:rooms', { rooms })
    })
    
    // ============================================
    // ОБРАБОТКА ОТКЛЮЧЕНИЯ
    // ============================================
    
    socket.on('disconnect', (reason) => {
      console.log(
        `[SubtaskSocket] 👋 User ${userId} disconnected | Reason: ${reason}`
      )
      
      // Socket.IO автоматически удаляет пользователя из всех комнат
      // Дополнительная очистка не требуется
    })
    
    // ============================================
    // ОБРАБОТКА ОШИБОК
    // ============================================
    
    socket.on('error', (error: any) => {
      console.error(`[SubtaskSocket] ❌ Socket error for user ${userId}:`, error)
    })
  })
  
  console.log('[SubtaskSocket] ✅ Subtask handlers registered successfully')
}

// ============================================
// УТИЛИТЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В API ENDPOINTS
// ============================================

/**
 * Получить и отправить данные подзадачи после создания
 * @param io - Экземпляр Socket.IO сервера
 * @param subtaskId - ID созданной подзадачи
 * @param taskId - ID задачи
 */
export async function handleSubtaskCreatedEvent(
  io: Server,
  subtaskId: number,
  taskId: number
): Promise<void> {
  try {
    // Получаем созданную подзадачу
    const [subtask] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
    
    if (!subtask) {
      console.error(`[SubtaskSocket] ❌ Subtask ${subtaskId} not found after creation`)
      return
    }
    
    // Получаем ID доски
    const boardId = await getBoardIdByTaskId(taskId)
    if (!boardId) {
      console.error(`[SubtaskSocket] ❌ Board not found for task ${taskId}`)
      return
    }
    
    // Конвертируем даты в строки для клиента
    const subtaskForClient: Subtask = {
      ...subtask,
      createdAt: subtask.createdAt ? new Date(subtask.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: subtask.updatedAt ? new Date(subtask.updatedAt).toISOString() : new Date().toISOString(),
      completedAt: subtask.completedAt ? new Date(subtask.completedAt).toISOString() : null
    }
    
    // Отправляем событие
    emitSubtaskCreated(io, subtaskForClient, boardId)
  } catch (error) {
    console.error('[SubtaskSocket] ❌ Error handling subtask created event:', error)
  }
}

/**
 * Получить и отправить данные подзадачи после обновления
 * @param io - Экземпляр Socket.IO сервера
 * @param subtaskId - ID обновлённой подзадачи
 */
export async function handleSubtaskUpdatedEvent(
  io: Server,
  subtaskId: number
): Promise<void> {
  try {
    // Получаем обновлённую подзадачу
    const [subtask] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
    
    if (!subtask) {
      console.error(`[SubtaskSocket] ❌ Subtask ${subtaskId} not found after update`)
      return
    }
    
    // Получаем ID доски
    const boardId = await getBoardIdByTaskId(subtask.taskId)
    if (!boardId) {
      console.error(`[SubtaskSocket] ❌ Board not found for task ${subtask.taskId}`)
      return
    }
    
    // Конвертируем даты в строки для клиента
    const subtaskForClient: Subtask = {
      ...subtask,
      createdAt: subtask.createdAt ? new Date(subtask.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: subtask.updatedAt ? new Date(subtask.updatedAt).toISOString() : new Date().toISOString(),
      completedAt: subtask.completedAt ? new Date(subtask.completedAt).toISOString() : null
    }
    
    // Отправляем событие
    emitSubtaskUpdated(io, subtaskForClient, boardId)
  } catch (error) {
    console.error('[SubtaskSocket] ❌ Error handling subtask updated event:', error)
  }
}

/**
 * Отправить событие удаления подзадачи
 * @param io - Экземпляр Socket.IO сервера
 * @param subtaskId - ID удалённой подзадачи
 * @param taskId - ID задачи
 */
export async function handleSubtaskDeletedEvent(
  io: Server,
  subtaskId: number,
  taskId: number
): Promise<void> {
  try {
    // Получаем ID доски
    const boardId = await getBoardIdByTaskId(taskId)
    if (!boardId) {
      console.error(`[SubtaskSocket] ❌ Board not found for task ${taskId}`)
      return
    }
    
    // Отправляем событие
    emitSubtaskDeleted(io, subtaskId, taskId, boardId)
  } catch (error) {
    console.error('[SubtaskSocket] ❌ Error handling subtask deleted event:', error)
  }
}
