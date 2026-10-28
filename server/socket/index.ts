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
import {
  setupUserHandlers,
  setupActivityHandlers
} from './handlers'
import { socketLog } from './logger'

import {
  getUserFromSocket,
  canUserJoinBoard,
  joinStandardRooms,
  syncOnlineViewersRoom,
  parseBoardRoomName,
  getBoardRoomName,
  withAcl
} from './utils'

// ============================================
// ГЛОБАЛЬНОЕ ХРАНИЛИЩЕ ПОДКЛЮЧЕНИЙ
// ============================================

/**
 * Активные сокет-подключения по ID пользователя.
 * Ключ: userId, Значение: Set<socketId>
 *
 * Один пользователь может держать несколько соединений одновременно
 * (несколько вкладок / устройств), поэтому храним набор socketId,
 * а не единственный Socket.
 *
 * Используется для:
 * - Проверки isUserConnected()
 * - Принудительного разрыва соединения (при смене прав)
 */
const activeSockets = new Map<number, Set<string>>()

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

/**
 * Зарегистрировать сокет за пользователем.
 * Поддерживает мультивкладочность: у одного userId может быть несколько socketId.
 */
function addUserSocket(userId: number, socketId: string): void {
  let socketIds = activeSockets.get(userId)
  if (!socketIds) {
    socketIds = new Set<string>()
    activeSockets.set(userId, socketIds)
  }
  socketIds.add(socketId)
}

/**
 * Удалить конкретный сокет пользователя.
 * Когда у пользователя не остаётся соединений — запись удаляется целиком,
 * чтобы activeSockets.size отражал число онлайн-пользователей.
 */
function removeUserSocket(userId: number, socketId: string): void {
  const socketIds = activeSockets.get(userId)
  if (!socketIds) return

  socketIds.delete(socketId)
  if (socketIds.size === 0) {
    activeSockets.delete(userId)
  }
}

/**
 * Получить количество подключений в комнате доски
 */
function getBoardRoomSize(io: Server, boardId: number): number {
  const roomName = getBoardRoomName(boardId)
  const room = io.sockets.adapter.rooms.get(roomName)
  return room?.size || 0
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
  // ✅ P8: РЕГИСТРАЦИЯ ПРЯМЫХ SOCKET-ОБРАБОТЧИКОВ ЗАДАЧ УДАЛЕНА
  // ============================================
  // registerTaskHandlers(io) вешал socket.on(board:task:created|updated|deleted) и
  // socket.on(board:tasks:reorder): рассылка в любую комнату board:{id} без ACL и
  // запись нового порядка задач прямо в БД (UPDATE boards_tasks) по клиентским id/order.
  // Клиент эти события не отправлял (рассылка идёт из REST через broadcastTask*()),
  // поэтому обработчики удалены — см. server/socket/handlers/tasks.ts.

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
    socketLog(`[Socket] 🔌 User ${userId} connected (socket: ${socket.id})`)

    try {
      // Регистрируем сокет за пользователем (поддерживаем мультивкладочность)
      addUserSocket(userId, socket.id)
      socketLog(
        `[Socket] 💾 Stored socket ${socket.id} for user ${userId} ` +
        `(${activeSockets.get(userId)?.size ?? 0} active connection(s))`
      )

      // ============================================
      // 🆕 ПРИСОЕДИНЕНИЕ К СТАНДАРТНЫМ КОМНАТАМ
      // ============================================
      // user:{id} — для персональных уведомлений
      // role:{role} — для широковещательных событий по ролям
      await joinStandardRooms(socket, user)

      // ✅ P5: подписываем на комнату онлайн-зрителей только при наличии права users:view
      await syncOnlineViewersRoom(socket, user)

      // ============================================
      // РЕГИСТРАЦИЯ ОБРАБОТЧИКОВ СОБЫТИЙ
      // ============================================

      setupUserHandlers(socket, user, io)
      setupActivityHandlers(socket, user, io)
      // ✅ P7: setupStatusHandlers() удалён — единственный его обработчик
      // 'status:update' не отправлялся ни одним клиентом (статусы меняются
      // через 'activity:afk'/'activity:resume' в setupActivityHandlers).

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
        // (источник правды о составе комнат — io.sockets.adapter.rooms)
        await socket.join(roomName)

        // 4. Отправляем подтверждение клиенту
        socketLog(
          `[Socket] ✅ User ${userId} joined room: ${roomName} ` +
          `(${getBoardRoomSize(io, boardId)} in room)`
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

          socketLog(`[Socket] 📴 User ${userId} left room: ${roomName}`)

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

      // ✅ P7: обработчик 'permissions:reload' удалён — клиент его не отправляет
      // (ни usePermissionsSocket, ни socketStore). Актуальный флоу синхронизации прав:
      // сервер → 'permissions:changed' в комнату user:{id} (см. notifyUserPermissionsChanged).

      // ============================================
      // ОТЛАДОЧНЫЕ ОБРАБОТЧИКИ
      // ============================================

      socket.on('debug:rooms', () => {
        const rooms = Array.from(socket.rooms)
        socketLog(`[Socket] 🔍 Debug: User ${userId} rooms:`, rooms)
        socket.emit('debug:rooms', {
          rooms,
          socketId: socket.id,
          userId
        })
      })

      socket.on('debug:stats', () => {
        // Источник правды — io.sockets.adapter.rooms (включает и комнаты сокетов,
        // поэтому фильтруем только комнаты досок с префиксом board:)
        const boardRoomNames = Array.from(io.sockets.adapter.rooms.keys())
          .filter(roomName => roomName.startsWith('board:'))

        const stats = {
          totalSockets: io.sockets.sockets.size,
          activeUsers: activeSockets.size,
          boardRooms: boardRoomNames.length,
          rooms: boardRoomNames.map(roomName => ({
            boardId: parseBoardRoomName(roomName),
            members: io.sockets.adapter.rooms.get(roomName)?.size ?? 0
          }))
        }
        socketLog(`[Socket] 🔍 Debug stats:`, stats)
        socket.emit('debug:stats', stats)
      })

      // ============================================
      // ОБРАБОТЧИК ОТКЛЮЧЕНИЯ
      // ============================================

      socket.on('disconnect', async (reason: string) => {
        socketLog(`[Socket] 👋 User ${userId} disconnected (socket: ${socket.id}, reason: ${reason})`)

        try {
          // Удаляем только ЭТОТ сокет: запись пользователя сохраняется,
          // пока у него есть другие активные соединения (вкладки/устройства)
          removeUserSocket(userId, socket.id)
          socketLog(
            `[Socket] 🗑️ Removed socket ${socket.id} for user ${userId} ` +
            `(${activeSockets.get(userId)?.size ?? 0} left)`
          )

          // Из комнат досок Socket.IO удаляет сокет автоматически при disconnect —
          // отдельная очистка не требуется.

          // ✅ P7: broadcast 'user:disconnected' удалён — в приложении нет ни одного
          // слушателя этого события; изменения присутствия идут через 'user:status'
          // (broadcastStatus) и комнату online:viewers.
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

      // ============================================
      // HEARTBEAT (диагностика)
      // ============================================
      // ⚠️ Основной клиент (SocketService) heartbeat НЕ отправляет — живость
      // соединения обеспечивают транспортные ping/pong engine.io, а статус —
      // activity-трекинг. Обработчик оставлен для диагностической страницы
      // /cabinet/testpage (кнопка «heartbeat» + ожидание 'heartbeat:ack').
      socket.on('heartbeat', () => {
        socket.emit('heartbeat:ack', {
          timestamp: new Date().toISOString(),
          socketId: socket.id
        })
      })

      // ✅ P7: обработчики 'ping'/'pong' удалены — ни один клиент их не отправляет
      // (в testpage 'pong' лишь закомментирован).
    } catch (error) {
      console.error(`[Socket] ❌ Connection error for user ${userId}:`, error)
      socket.disconnect(true)
    }
  })

  console.log('[Socket] ✅ Socket.IO server initialized successfully')
}

// ============================================
// ЭКСПОРТЫ ДЛЯ ИСПОЛЬЗОВАНИЯ В API
// ============================================

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
    socketLog(`[Socket] ⚠️ No users in role "${role}"`)
    return 0
  }

  let count = 0
  // Снапшот списка сокетов: disconnect() мутирует комнату во время итерации
  for (const socketId of Array.from(room)) {
    const socket = io.sockets.sockets.get(socketId)
    if (socket) {
      const userId = socket.data?.userId
      if (typeof userId === 'number') {
        socket.emit('force:disconnect', {
          reason,
          role,
          timestamp: new Date().toISOString()
        })
        removeUserSocket(userId, socket.id)
        socket.disconnect(true)
        count++
      }
    }
  }

  socketLog(`[Socket] 🔌 Force disconnected ${count} users of role "${role}"`)
  return count
}
