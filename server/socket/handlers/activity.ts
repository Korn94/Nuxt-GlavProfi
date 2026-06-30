// server/socket/handlers/activity.ts
import type { Socket, Server } from 'socket.io'
import { updateSessionStatus } from '../../utils/sessions'
import { broadcastStatus } from './status'
import { scheduleOnlineBroadcast } from '../../utils/online-broadcast'

export function setupActivityHandlers(socket: Socket, user: any, io: Server) {
  const userName = user.name || user.email || 'Unknown'

  // ✅ ОБЫЧНАЯ АКТИВНОСТЬ — только UPDATE в БД, без broadcast
  socket.on('activity', async (data) => {
    try {
      const { sessionId, status, ipAddress } = data
      if (!sessionId) {
        console.error('Activity event without sessionId')
        return
      }
      
      // Только обновляем lastActivity в БД, НЕ запрашиваем getOnlineUsers()
      await updateSessionStatus(sessionId, status, { ipAddress })
      
      // ✅ Debounce: накапливаем изменения
      scheduleOnlineBroadcast(io)
      
    } catch (error) {
      console.error('Error handling activity event:', error)
    }
  })

  // ✅ ВОЗВРАТ ИЗ AFK — немедленный broadcast (важное событие)
  socket.on('activity:resume', async (data) => {
    try {
      const { sessionId, ipAddress } = data
      if (!sessionId) {
        console.error('Resume event without sessionId')
        return
      }
      
      console.log(`[Activity] 🟢 User ${sessionId} resumed from AFK`)
      
      await updateSessionStatus(sessionId, 'online', { ipAddress })
      
      broadcastStatus(io, socket, user.id, userName, 'online', {
        sessionId,
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
      const { sessionId, ipAddress } = data
      if (!sessionId) {
        console.error('AFK event without sessionId')
        return
      }
      
      await updateSessionStatus(sessionId, 'afk', { ipAddress })
      
      broadcastStatus(io, socket, user.id, userName, 'afk', {
        sessionId
      })
      
      // ✅ Немедленная отправка (важное изменение статуса)
      const { immediateOnlineBroadcast } = await import('../../utils/online-broadcast')
      await immediateOnlineBroadcast(io)
    } catch (error) {
      console.error('Error handling afk event:', error)
    }
  })
}
