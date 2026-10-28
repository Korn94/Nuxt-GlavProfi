// server/socket/handlers/status.ts
import type { Socket, Server } from 'socket.io'
import type { UserStatusEvent } from '../events/status'
import { socketLog } from '../logger'

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

  // socket.broadcast.emit доставляет событие всем сокетам, КРОМЕ отправителя,
  // включая другие вкладки того же пользователя. Отдельная отправка в комнату
  // user:{id} не нужна — получатели те же, и событие приходило дважды.
  socket.broadcast.emit('user:status', eventData)

  socketLog(`[Status] Broadcast: ${userName} is now ${status}`)
}

/**
 * Регистрация обработчиков статусов.
 *
 * ✅ P7: обработчик 'status:update' удалён — ни один клиент его не отправлял.
 * Смена статуса идёт через 'activity:afk' / 'activity:resume'
 * (server/socket/handlers/activity.ts), которые вызывают broadcastStatus().
 * Функция setupStatusHandlers() удалена вместе с обработчиком.
 */

/**
 * Экспортируем функции для использования в других обработчиках
 */
export { broadcastStatus }
