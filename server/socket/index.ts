// server/socket/index.ts
/**
 * Центральная точка регистрации всех Socket.IO обработчиков
 * 
 * Архитектура:
 * - Middleware для аутентификации подключений
 * - Регистрация обработчиков для всех модулей (users, tasks, subtasks, etc.)
 * - Поддержка комнат досок (board:{boardId}) для real-time обновлений
 * - Глобальное хранилище активных подключений
 */

import type { Server, Socket } from 'socket.io'
import { socketAuthMiddleware } from './middleware/auth'
import { setupUserHandlers, setupActivityHandlers } from './handlers'
import { setupStatusHandlers } from './handlers/status'
import { registerTaskHandlers } from './handlers/tasks'
import { registerSubtaskHandlers } from './handlers/subtasks'

// ============================================
// ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ ПОДКЛЮЧЕНИЙ
// ============================================

/**
 * Активные сокет-подключения по ID пользователя
 * Ключ: userId, Значение: Socket
 */
const activeSockets = new Map<number, Socket>()

/**
 * Подключения по комнатам досок
 * Ключ: boardId, Значение: Set<socketId>
 */
const boardRooms = new Map<number, Set<string>>()

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получить количество подключений в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param boardId - ID доски
 */
function getBoardRoomSize(io: Server, boardId: number): number {
  const roomName = `board:${boardId}`
  const room = io.sockets.adapter.rooms.get(roomName)
  return room?.size || 0
}

/**
 * Отправить событие всем в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param boardId - ID доски
 * @param event - Имя события
 * @param data - Данные события
 */
function emitToBoardRoom<T>(
  io: Server,
  boardId: number,
  event: string,
  data: T
): void {
  const roomName = `board:${boardId}`
  io.to(roomName).emit(event, data)
  
  console.log(
    `[Socket] 📡 Emitted "${event}" to room "${roomName}" (${getBoardRoomSize(io, boardId)} clients)`
  )
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ СЕРВЕРА
// ============================================

/**
 * Инициализация Socket.IO сервера
 * @param io - Экземпляр сервера Socket.IO
 */
export function setupSocketServer(io: Server): void {
  console.log('[Socket] 🚀 Initializing Socket.IO server...')
  
  // ============================================
  // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ ДО ПОДКЛЮЧЕНИЯ КЛИЕНТОВ
  // ============================================
  
  // Обработчики задач
  registerTaskHandlers(io)
  console.log('[Socket] ✅ Task handlers registered')
  
  // Обработчики подзадач
  registerSubtaskHandlers(io)
  console.log('[Socket] ✅ Subtask handlers registered')
  
  // ============================================
  // MIDDLEWARE ДЛЯ АУТЕНТИФИКАЦИИ
  // ============================================
  
  io.use((socket: Socket, next) => {
    socketAuthMiddleware(socket, next)
  })
  
  console.log('[Socket] ✅ Auth middleware registered')
  
  // ============================================
  // ОБРАБОТЧИК ПОДКЛЮЧЕНИЯ
  // ============================================
  
  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user
    const userId = user?.id || 'unknown'
    
    console.log(`[Socket] 🔌 User ${userId} connected (socket: ${socket.id})`)
    
    try {
      // Сохраняем сокет в глобальном хранилище
      if (user?.id) {
        activeSockets.set(user.id, socket)
        console.log(`[Socket] 💾 Stored socket for user ${userId}`)
      }
      
      // ============================================
      // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ СОБЫТИЙ
      // ============================================
      
      // Обработчики пользователей
      setupUserHandlers(socket, user, io)
      
      // Обработчики активности
      setupActivityHandlers(socket, user, io)
      
      // Обработчики статусов
      setupStatusHandlers(socket, user, io)
      
      // ============================================
      // ОБРАБОТЧИК ПОДПИСКИ НА ДОСКУ
      // ============================================
      
      socket.on('join', async (roomName: string) => {
        try {
          // Проверяем формат комнаты (должен быть board:{boardId})
          if (!roomName.startsWith('board:')) {
            console.warn(`[Socket] ⚠️ Invalid room format: ${roomName}`)
            socket.emit('error', {
              message: 'Неверный формат комнаты',
              code: 'INVALID_ROOM_FORMAT'
            })
            return
          }
          
          const boardId = parseInt(roomName.replace('board:', ''), 10)
          
          if (isNaN(boardId)) {
            console.warn(`[Socket] ⚠️ Invalid boardId in room: ${roomName}`)
            socket.emit('error', {
              message: 'Неверный ID доски',
              code: 'INVALID_BOARD_ID'
            })
            return
          }
          
          // Подписываем сокет на комнату
          await socket.join(roomName)
          
          // Обновляем статистику комнат
          const currentRooms = Array.from(socket.rooms)
          console.log(
            `[Socket] ✅ User ${userId} joined room: ${roomName}`
          )
          console.log(
            `[Socket] 📊 User ${userId} rooms: ${currentRooms.length} | Members in room: ${getBoardRoomSize(io, boardId)}`
          )
          
          // Отправляем подтверждение клиенту
          socket.emit('board:subscribed', {
            boardId,
            success: true,
            room: roomName,
            membersCount: getBoardRoomSize(io, boardId)
          })
          
          // Обновляем мапу комнат
          if (!boardRooms.has(boardId)) {
            boardRooms.set(boardId, new Set())
          }
          boardRooms.get(boardId)?.add(socket.id)
          
        } catch (error) {
          console.error(`[Socket] ❌ Error joining room ${roomName}:`, error)
          socket.emit('error', {
            message: 'Ошибка подписки на доску',
            code: 'JOIN_ROOM_ERROR'
          })
        }
      })
      
      // ============================================
      // ОБРАБОТЧИК ОТПИСКИ ОТ ДОСКИ
      // ============================================
      
      socket.on('leave', async (roomName: string) => {
        try {
          if (!roomName.startsWith('board:')) {
            console.warn(`[Socket] ⚠️ Invalid room format: ${roomName}`)
            return
          }
          
          const boardId = parseInt(roomName.replace('board:', ''), 10)
          
          await socket.leave(roomName)
          
          const currentRooms = Array.from(socket.rooms)
          console.log(
            `[Socket] 📴 User ${userId} left room: ${roomName}`
          )
          console.log(
            `[Socket] 📊 User ${userId} remaining rooms: ${currentRooms.length} | Members in room: ${getBoardRoomSize(io, boardId)}`
          )
          
          // Отправляем подтверждение клиенту
          socket.emit('board:unsubscribed', {
            room: roomName,
            success: true
          })
          
          // Обновляем мапу комнат
          if (boardId) {
            boardRooms.get(boardId)?.delete(socket.id)
          }
          
        } catch (error) {
          console.error(`[Socket] ❌ Error leaving room ${roomName}:`, error)
        }
      })
      
      // ============================================
      // ОТЛАДОЧНЫЕ ОБРАБОТЧИКИ
      // ============================================
      
      // Запрос списка комнат (для отладки)
      socket.on('debug:rooms', () => {
        const rooms = Array.from(socket.rooms)
        console.log(`[Socket] 🔍 Debug: User ${userId} rooms:`, rooms)
        socket.emit('debug:rooms', { 
          rooms,
          socketId: socket.id,
          userId
        })
      })
      
      // Запрос статистики сервера
      socket.on('debug:stats', () => {
        const stats = {
          totalSockets: io.sockets.sockets.size,
          activeUsers: activeSockets.size,
          boardRooms: boardRooms.size,
          rooms: Array.from(boardRooms.entries()).map(([boardId, sockets]) => ({
            boardId,
            members: sockets.size
          }))
        }
        console.log(`[Socket] 🔍 Debug stats:`, stats)
        socket.emit('debug:stats', stats)
      })
      
      // ============================================
      // ОБРАБОТЧИК ОТКЛЮЧЕНИЯ
      // ============================================
      
      socket.on('disconnect', async (reason: string) => {
        console.log(`[Socket] 👋 User ${userId} disconnected (socket: ${socket.id})`)
        console.log(`[Socket] 📋 Disconnect reason: ${reason}`)
        
        try {
          // Удаляем сокет из глобального хранилища
          if (user?.id) {
            activeSockets.delete(user.id)
            console.log(`[Socket] 🗑️ Removed socket for user ${userId}`)
          }
          
          // Очищаем подписки на комнаты
          const rooms = Array.from(socket.rooms)
          for (const roomName of rooms) {
            if (roomName.startsWith('board:')) {
              const boardId = parseInt(roomName.replace('board:', ''), 10)
              if (boardId) {
                boardRooms.get(boardId)?.delete(socket.id)
              }
            }
          }
          
          // Уведомляем других пользователей об отключении
          socket.broadcast.emit('user:disconnected', {
            userId,
            socketId: socket.id,
            timestamp: new Date().toISOString()
          })
          
          console.log(`[Socket] ✅ Cleanup completed for user ${userId}`)
          
        } catch (error) {
          console.error(`[Socket] ❌ Error during disconnect cleanup:`, error)
        }
      })
      
      // ============================================
      // ОБРАБОТЧИК ОШИБОК
      // ============================================
      
      socket.on('error', (error: any) => {
        console.error(`[Socket] ❌ Socket error for user ${userId}:`, error)
      })
      
      socket.on('connect_error', (error: any) => {
        console.error(`[Socket] ❌ Connect error for socket ${socket.id}:`, error.message)
      })
      
      // ============================================
      // HEARTBEAT / PING-PONG
      // ============================================
      
      socket.on('heartbeat', () => {
        socket.emit('heartbeat:ack', {
          timestamp: new Date().toISOString(),
          socketId: socket.id
        })
      })
      
      socket.on('ping', () => {
        socket.emit('pong', {
          timestamp: Date.now(),
          socketId: socket.id
        })
      })
      
    } catch (error) {
      console.error(`[Socket] ❌ Connection error for user ${userId}:`, error)
      socket.disconnect(true)
    }
  })
  
  // ============================================
  // ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ СЕРВЕРА
  // ============================================
  
  io.on('connect_error', (error: any) => {
    console.error('[Socket] ❌ Global connect error:', error.message)
  })
  
  console.log('[Socket] ✅ Socket.IO server initialized successfully')
  console.log(`[Socket] 📊 Initial stats: ${activeSockets.size} active users, ${boardRooms.size} board rooms`)
}

// ============================================
// ЭКСПОРТЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В API
// ============================================

/**
 * Получить экземпляр активного сокета пользователя
 * @param userId - ID пользователя
 */
export function getUserSocket(userId: number): Socket | undefined {
  return activeSockets.get(userId)
}

/**
 * Проверить, подключён ли пользователь
 * @param userId - ID пользователя
 */
export function isUserConnected(userId: number): boolean {
  return activeSockets.has(userId)
}

/**
 * Получить количество подключений в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param boardId - ID доски
 */
export function getBoardRoomMembersCount(io: Server, boardId: number): number {
  return getBoardRoomSize(io, boardId)
}

/**
 * Отправить событие всем в комнате доски
 * @param io - Экземпляр Socket.IO сервера
 * @param boardId - ID доски
 * @param event - Имя события
 * @param data - Данные события
 */
export function broadcastToBoard<T>(
  io: Server,
  boardId: number,
  event: string,
  data: T
): void {
  emitToBoardRoom(io, boardId, event, data)
}

/**
 * Получить статистику сокет-сервера
 * @param io - Экземпляр Socket.IO сервера
 */
export function getSocketStats(io: Server): {
  totalSockets: number
  activeUsers: number
  boardRooms: number
  rooms: Array<{ boardId: number; members: number }>
} {
  return {
    totalSockets: io.sockets.sockets.size,
    activeUsers: activeSockets.size,
    boardRooms: boardRooms.size,
    rooms: Array.from(boardRooms.entries()).map(([boardId, sockets]) => ({
      boardId,
      members: sockets.size
    }))
  }
}

/**
 * Очистить хранилище подключений (для тестов или перезагрузки)
 */
export function clearSocketStorage(): void {
  activeSockets.clear()
  boardRooms.clear()
  console.log('[Socket] 🧹 Socket storage cleared')
}
