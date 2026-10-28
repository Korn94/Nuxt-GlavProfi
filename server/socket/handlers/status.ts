// server/socket/handlers/status.ts
import type { Socket, Server } from 'socket.io'
import type { UserStatusEvent } from '../events/status'
import { socketLog } from '../logger'
import { ONLINE_VIEWERS_ROOM } from '../utils'

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

  // ✅ P8 (ACL): присутствие (userId/userName/status) уходит только в комнату
  // online:viewers — та же аудитория, что у списка онлайна и GET /api/online
  // (server/socket/utils.ts -> ONLINE_VIEWERS_ROOM, право users:view).
  // Раньше был socket.broadcast.emit: событие получали ВСЕ авторизованные сокеты,
  // включая роли без права users:view — это противоречило ACL списка онлайна.
  // .except(socket.id) сохраняет прежнюю семантику «всем, кроме отправителя».
  io.to(ONLINE_VIEWERS_ROOM).except(socket.id).emit('user:status', eventData)

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
