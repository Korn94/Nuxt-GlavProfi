// server/socket/handlers/activity.ts
import type { Socket, Server } from 'socket.io'
import { updateSessionStatus } from '../../utils/sessions'
import { broadcastStatus } from './status'
import { scheduleOnlineBroadcast } from '../../utils/online-broadcast'
import { socketLog } from '../logger'

/**
 * ✅ P4: берём sessionId ТОЛЬКО из сокета.
 * Клиентский sessionId из payload игнорируется — иначе клиент мог бы менять чужую сессию.
 */
function getSocketSessionId(socket: Socket): string | null {
  const sessionId = (socket as any).sessionId as string | undefined
  if (!sessionId) {
    console.warn('[Activity] ⚠️ Событие активности до инициализации сессии сокета — игнорируем')
    return null
  }
  return sessionId
}

export function setupActivityHandlers(socket: Socket, user: any, io: Server) {
  const userName = user.name || user.email || 'Unknown'

  // ✅ ОБЫЧНАЯ АКТИВНОСТЬ — только UPDATE в БД, без broadcast
  socket.on('activity', async (data) => {
    try {
      const serverSessionId = getSocketSessionId(socket)
      if (!serverSessionId) return

      const { status, ipAddress } = data

      // ✅ P4: защита от мусорного status из payload
      const allowed: Array<'online' | 'afk' | 'offline'> = ['online', 'afk', 'offline']
      if (!allowed.includes(status)) {
        console.warn('[Activity] ⚠️ Недопустимый status в событии activity:', status)
        return
      }

      // Только обновляем lastActivity в БД, НЕ запрашиваем getOnlineUsers()
      await updateSessionStatus(serverSessionId, status, { ipAddress })
      
      // ✅ Debounce: накапливаем изменения
      scheduleOnlineBroadcast(io)
      
    } catch (error) {
      console.error('Error handling activity event:', error)
    }
  })

  // ✅ ВОЗВРАТ ИЗ AFK — немедленный broadcast (важное событие)
  socket.on('activity:resume', async (data) => {
    try {
      const serverSessionId = getSocketSessionId(socket)
      if (!serverSessionId) return

      const { ipAddress } = data

      socketLog(`[Activity] 🟢 User ${serverSessionId} resumed from AFK`)

      await updateSessionStatus(serverSessionId, 'online', { ipAddress })

      broadcastStatus(io, socket, user.id, userName, 'online', {
        sessionId: serverSessionId,
        fromAFK: true
      })
      
      // ✅ Немедленная отправка (важное изменение статуса)
      const { immediateOnlineBroadcast } = await import('../../utils/online-broadcast')
      await immediateOnlineBroadcast(io)
    } catch (error) {
      console.error('Error handling resume event:', error)
    }
  })

  // ✅ УХОД В AFK — немедленный broadcast (важное событие)
  socket.on('activity:afk', async (data) => {
    try {
      const serverSessionId = getSocketSessionId(socket)
      if (!serverSessionId) return

      const { ipAddress } = data

      await updateSessionStatus(serverSessionId, 'afk', { ipAddress })

      broadcastStatus(io, socket, user.id, userName, 'afk', {
        sessionId: serverSessionId
      })
      
      // ✅ Немедленная отправка (важное изменение статуса)
      const { immediateOnlineBroadcast } = await import('../../utils/online-broadcast')
      await immediateOnlineBroadcast(io)
    } catch (error) {
      console.error('Error handling afk event:', error)
    }
  })
}
