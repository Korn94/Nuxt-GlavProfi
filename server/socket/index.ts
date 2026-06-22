// server/socket/index.ts
/**
 * Центральная точка регистрации всех Socket.IO обработчиков
 *
 * Архитектура:
 * - Middleware для аутентификации подключений (socketAuthMiddleware)
 * - ACL-проверки для подписок и событий (через utils)
 * - Присоединение к стандартным комнатам (user, role) при подключении
 * - Поддержка комнат досок (board:{boardId}) для real-time обновлений
 * - Глобальное хранилище активных подключений
 * - Обработка permissions:changed для синхронизации при изменении прав
 *
 * Интеграция с ACL:
 * - getUserFromSocket() — извлечение аутентифицированного пользователя
 * - canUserJoinBoard() — проверка права на подписку к доске
 * - withAcl() — обёртка для автоматической обработки ACL-ошибок
 * - joinStandardRooms() — подключение к user:{id} и role:{role} комнатам
 */

import type { Server, Socket } from 'socket.io'
import { socketAuthMiddleware } from './middleware/auth'
import { setupUserHandlers, setupActivityHandlers } from './handlers'
import { setupStatusHandlers } from './handlers/status'
import { registerTaskHandlers } from './handlers/tasks'
import { registerSubtaskHandlers } from './handlers/subtasks'
import { registerColumnHandlers } from './handlers/columns'

import {
  getUserFromSocket,
  canUserJoinBoard,
  joinStandardRooms,
  parseBoardRoomName,
  getBoardRoomName,
  withAcl,
  SocketPermissionError
} from './utils'

// ============================================
// ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ ПОДКЛЮЧЕНИЙ
// ============================================

/**
 * Активные сокет-подключения по ID пользователя
 * Ключ: userId, Значение: Socket
 *
 * Используется для:
 * - Отправки событий конкретному пользователю
 * - Проверки isUserConnected()
 * - Принудительного разрыва соединения (при смене прав)
 */
const activeSockets = new Map<number, Socket>()

/**
 * Подключения по комнатам досок
 * Ключ: boardId, Значение: Set<socketId>
 *
 * Используется для статистики и быстрой проверки подписок.
 */
const boardRooms = new Map<number, Set<string>>()

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Получить количество подключений в комнате доски
 */
function getBoardRoomSize(io: Server, boardId: number): number {
  const roomName = getBoardRoomName(boardId)
  const room = io.sockets.adapter.rooms.get(roomName)
  return room?.size || 0
}

/**
 * Отправить событие всем в комнате доски
 */
function emitToBoardRoom<T>(
  io: Server,
  boardId: number,
  event: string,
  data: T
): void {
  const roomName = getBoardRoomName(boardId)
  io.to(roomName).emit(event, data)

  console.log(
    `[Socket] 📡 Emitted "${event}" to room "${roomName}" ` +
    `(${getBoardRoomSize(io, boardId)} clients)`
  )
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ СЕРВЕРА
// ============================================

/**
 * Инициализация Socket.IO сервера
 * Вызывается из socket/dev.ts и socket/prod.ts
 */
export function setupSocketServer(io: Server): void {
  console.log('[Socket] 🚀 Initializing Socket.IO server...')

  // ============================================
  // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ ДО ПОДКЛЮЧЕНИЯ КЛИЕНТОВ
  // ============================================
  // Эти хендлеры регистрируются глобально на io (не на socket)
  // и работают без привязки к конкретному подключению

  registerTaskHandlers(io)
  console.log('[Socket] ✅ Task handlers registered')

  registerSubtaskHandlers(io)
  console.log('[Socket] ✅ Subtask handlers registered')

  registerColumnHandlers(io)
  console.log('[Socket] ✅ Column handlers registered')

  // ============================================
  // MIDDLEWARE ДЛЯ АУТЕНТИФИКАЦИИ
  // ============================================
  // Выполняется до 'connection' — если middleware бросит ошибку,
  // подключение будет отклонено

  io.use((socket: Socket, next) => {
    socketAuthMiddleware(socket, next)
  })

  console.log('[Socket] ✅ Auth middleware registered')

  // ============================================
  // ОБРАБОТЧИК ПОДКЛЮЧЕНИЯ
  // ============================================

  io.on('connection', async (socket: Socket) => {
    // Пользователь уже аутентифицирован в middleware
    let user
    try {
      user = getUserFromSocket(socket)
    } catch (error) {
      console.error(`[Socket] ❌ Не удалось получить user из сокета ${socket.id}`)
      socket.disconnect(true)
      return
    }

    const userId = user.id
    console.log(`[Socket] 🔌 User ${userId} connected (socket: ${socket.id})`)

    try {
      // Сохраняем сокет в глобальном хранилище
      activeSockets.set(userId, socket)
      console.log(`[Socket] 💾 Stored socket for user ${userId}`)

      // ============================================
      // 🆕 ПРИСОЕДИНЕНИЕ К СТАНДАРТНЫМ КОМНАТАМ
      // ============================================
      // user:{id} — для персональных уведомлений
      // role:{role} — для широковещательных событий по ролям
      await joinStandardRooms(socket, user)

      // ============================================
      // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ СОБЫТИЙ
      // ============================================

      setupUserHandlers(socket, user, io)
      setupActivityHandlers(socket, user, io)
      setupStatusHandlers(socket, user, io)

      // ============================================
      // 🛡️ ОБРАБОТЧИК ПОДПИСКИ НА ДОСКУ (С ACL-ПРОВЕРКОЙ)
      // ============================================

      socket.on('join', withAcl(socket, async (roomName: string) => {
        // 1. Парсим boardId из названия комнаты
        const boardId = parseBoardRoomName(roomName)

        if (boardId === null) {
          console.warn(`[Socket] ⚠️ Invalid room format: ${roomName}`)
          socket.emit('error', {
            message: 'Неверный формат комнаты (ожидается board:{id})',
            code: 'INVALID_ROOM_FORMAT'
          })
          return
        }

        // 2. 🛡️ ACL-ПРОВЕРКА: есть ли у пользователя право на эту доску?
        // canUserJoinBoard бросит SocketPermissionError при отказе,
        // который будет пойман в withAcl() и отправлен клиенту
        await canUserJoinBoard(socket, user, boardId)

        // 3. Подписываем сокет на комнату
        await socket.join(roomName)

        // 4. Обновляем мапу комнат
        if (!boardRooms.has(boardId)) {
          boardRooms.set(boardId, new Set())
        }
        boardRooms.get(boardId)!.add(socket.id)

        // 5. Отправляем подтверждение клиенту
        const currentRooms = Array.from(socket.rooms)
        console.log(
          `[Socket] ✅ User ${userId} joined room: ${roomName} ` +
          `(${currentRooms.length} total, ${getBoardRoomSize(io, boardId)} in room)`
        )

        socket.emit('board:subscribed', {
          boardId,
          success: true,
          room: roomName,
          membersCount: getBoardRoomSize(io, boardId)
        })
      }))

      // ============================================
      // ОБРАБОТЧИК ОТПИСКИ ОТ ДОСКИ
      // ============================================
      // Отписка не требует ACL-проверки (пользователь сам выходит)

      socket.on('leave', async (roomName: string) => {
        try {
          const boardId = parseBoardRoomName(roomName)

          if (boardId === null) {
            console.warn(`[Socket] ⚠️ Invalid room format: ${roomName}`)
            return
          }

          await socket.leave(roomName)

          // Обновляем мапу комнат
          boardRooms.get(boardId)?.delete(socket.id)

          const currentRooms = Array.from(socket.rooms)
          console.log(
            `[Socket] 📴 User ${userId} left room: ${roomName} ` +
            `(${currentRooms.length} remaining)`
          )

          socket.emit('board:unsubscribed', {
            room: roomName,
            success: true
          })
        } catch (error) {
          console.error(`[Socket] ❌ Error leaving room ${roomName}:`, error)
        }
      })

      // ============================================
      // 🔄 ОБРАБОТЧИК ИЗМЕНЕНИЯ ПРАВ (синхронизация между pod'ами)
      // ============================================
      // Когда админ меняет права роли через UI, сервер отправляет событие
      // 'permissions:changed' в комнату role:{role}.
      // Все подключённые пользователи этой роли получают уведомление
      // и должны обновить свои права (или переподключиться).

      socket.on('permissions:reload', async () => {
        console.log(`[Socket] 🔄 User ${userId} запросил перезагрузку прав`)
        // Клиент сам вызовет /api/permissions и обновит authStore
        // Мы просто подтверждаем получение
        socket.emit('permissions:reload:ack', {
          timestamp: new Date().toISOString()
        })
      })

      // ============================================
      // ОТЛАДОЧНЫЕ ОБРАБОТЧИКИ
      // ============================================

      socket.on('debug:rooms', () => {
        const rooms = Array.from(socket.rooms)
        console.log(`[Socket] 🔍 Debug: User ${userId} rooms:`, rooms)
        socket.emit('debug:rooms', {
          rooms,
          socketId: socket.id,
          userId
        })
      })

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
          activeSockets.delete(userId)
          console.log(`[Socket] 🗑️ Removed socket for user ${userId}`)

          // Очищаем подписки на комнаты досок
          const rooms = Array.from(socket.rooms)
          for (const roomName of rooms) {
            const boardId = parseBoardRoomName(roomName)
            if (boardId !== null) {
              boardRooms.get(boardId)?.delete(socket.id)
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
      // ОБРАБОТЧИКИ ОШИБОК
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
 */
export function isUserConnected(userId: number): boolean {
  return activeSockets.has(userId)
}

/**
 * Получить количество подключений в комнате доски
 */
export function getBoardRoomMembersCount(io: Server, boardId: number): number {
  return getBoardRoomSize(io, boardId)
}

/**
 * Отправить событие всем в комнате доски
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
 * 🆕 Отправить событие всем пользователям с определённой ролью.
 * Используется при изменении прав роли через UI.
 *
 * @example
 * // После обновления прав роли 'manager':
 * await notifyRole(io, 'manager', 'permissions:changed', { role: 'manager' })
 */
export function notifyRole(
  io: Server,
  role: string,
  event: string,
  data: any
): void {
  const roomName = `role:${role}`
  const room = io.sockets.adapter.rooms.get(roomName)
  const count = room?.size || 0

  io.to(roomName).emit(event, data)

  console.log(
    `[Socket] 📣 Notified role "${role}" (${count} users) with event "${event}"`
  )
}

/**
 * 🆕 Принудительно отключить сокет пользователя.
 * Используется когда права пользователя отозваны или роль понижена.
 *
 * @example
 * // После удаления override прав:
 * forceDisconnectUser(userId, 'Права отозваны администратором')
 */
export function forceDisconnectUser(userId: number, reason: string = 'Disconnected by admin'): boolean {
  const socket = activeSockets.get(userId)

  if (!socket) {
    console.log(`[Socket] ⚠️ User ${userId} not connected, nothing to disconnect`)
    return false
  }

  console.log(`[Socket] 🔌 Force disconnecting user ${userId}: ${reason}`)

  // Отправляем клиенту уведомление, чтобы он мог корректно обработать
  socket.emit('force:disconnect', {
    reason,
    timestamp: new Date().toISOString()
  })

  // Разрываем соединение
  socket.disconnect(true)
  activeSockets.delete(userId)

  return true
}

/**
 * 🆕 Принудительно отключить всех пользователей с определённой ролью.
 * Используется когда меняются глобальные права роли.
 *
 * @example
 * // После обновления прав роли 'worker':
 * const count = forceDisconnectRole('worker', 'Права роли обновлены')
 */
export function forceDisconnectRole(io: Server, role: string, reason: string = 'Role permissions changed'): number {
  const roomName = `role:${role}`
  const room = io.sockets.adapter.rooms.get(roomName)

  if (!room) {
    console.log(`[Socket] ⚠️ No users in role "${role}"`)
    return 0
  }

  let count = 0
  for (const socketId of room) {
    const socket = io.sockets.sockets.get(socketId)
    if (socket) {
      const userId = socket.data?.userId
      if (typeof userId === 'number') {
        socket.emit('force:disconnect', {
          reason,
          role,
          timestamp: new Date().toISOString()
        })
        socket.disconnect(true)
        activeSockets.delete(userId)
        count++
      }
    }
  }

  console.log(`[Socket] 🔌 Force disconnected ${count} users of role "${role}"`)
  return count
}

/**
 * Очистить хранилище подключений (для тестов или перезагрузки)
 */
export function clearSocketStorage(): void {
  activeSockets.clear()
  boardRooms.clear()
  console.log('[Socket] 🧹 Socket storage cleared')
}
