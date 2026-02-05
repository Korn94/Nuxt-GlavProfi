// server/socket/handlers/status.ts
import type { Socket, Server } from 'socket.io'
import { getOnlineUsers } from '../../utils/sessions'
import type { UserStatusEvent } from '../events/status'

/**
 * Отправка уведомления о статусе пользователя
 */
function broadcastStatus(
  io: Server,
  socket: Socket,
  userId: number,
  userName: string,
  status: 'online' | 'offline' | 'afk',
  options?: { fromAFK?: boolean; sessionId?: string }
) {
  const eventData: UserStatusEvent = {
    type: status,
    userId,
    userName,
    timestamp: new Date().toISOString(),
    fromAFK: options?.fromAFK,
    sessionId: options?.sessionId
  }

  socket.broadcast.emit('user:status', eventData)

  // Отправляем всем кроме самого пользователя
  // io.emit('user:status', eventData)
  
  console.log(`[Status] Broadcast: ${userName} is now ${status}`)
}

/**
 * Регистрация обработчиков статусов
 */
export function setupStatusHandlers(socket: Socket, user: any, io: Server) {
  const userName = user.name || user.login

  // Обработчик ручного обновления статуса
  socket.on('status:update', async (data: { status: 'online' | 'afk' | 'offline' }) => {
    try {
      const sessionId = (socket as any).sessionId
      if (!sessionId) {
        console.warn('[Status] No sessionId for status update')
        return
      }

      console.log(`[Status] Manual status update: ${userName} -> ${data.status}`)

      // Отправляем уведомление
      broadcastStatus(io, socket, user.id, userName, data.status, {
        sessionId
      })

      // Обновляем список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      io.emit('online-users:update', onlineUsers)

    } catch (error) {
      console.error('[Status] Error updating status:', error)
      socket.emit('error', {
        message: 'Failed to update status',
        code: 'STATUS_UPDATE_ERROR'
      })
    }
  })

  // Обработчик запроса текущего статуса
  socket.on('status:request', (targetUserId: number) => {
    // Можно добавить логику для получения статуса конкретного пользователя
    console.log(`[Status] Status request for user ${targetUserId}`)
  })

  console.log('[Status] Handlers registered for user:', userName)
}

/**
 * Экспортируем функции для использования в других обработчиках
 */
export { broadcastStatus }
