// server/socket/handlers/activity.ts
import type { Socket, Server } from 'socket.io'
import { updateSessionStatus, getOnlineUsers } from '../../utils/sessions'
import { broadcastStatus } from './status'

export function setupActivityHandlers(socket: Socket, user: any, io: Server) {
  const userName = user.name || user.email || 'Unknown'

  socket.on('activity', async (data) => {
    try {
      const { sessionId, status, ipAddress } = data
      if (!sessionId) {
        console.error('Activity event without sessionId')
        return
      }
      
      await updateSessionStatus(sessionId, status, ipAddress)
      
      const onlineUsers = await getOnlineUsers()
      io.emit('online-users:update', onlineUsers)
      
    } catch (error) {
      console.error('Error handling activity event:', error)
    }
  })

  // ✅ ОСТАВЛЯЕМ ТОЛЬКО ДЛЯ ВОЗВРАТА ИЗ АФК
  socket.on('activity:resume', async (data) => {
    try {
      const { sessionId, ipAddress } = data
      if (!sessionId) {
        console.error('Resume event without sessionId')
        return
      }
      
      await updateSessionStatus(sessionId, 'online', ipAddress)
      
      // ✅ ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ ТОЛЬКО О ВОЗВРАЩЕНИИ ИЗ АФК
      broadcastStatus(io, socket, user.id, userName, 'online', {
        sessionId,
        fromAFK: true
      })
      
      const onlineUsers = await getOnlineUsers()
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('Error handling resume event:', error)
    }
  })

  // ✅ ОСТАВЛЯЕМ ТОЛЬКО ДЛЯ УХОДА В АФК
  socket.on('activity:afk', async (data) => {
    try {
      const { sessionId, ipAddress } = data
      if (!sessionId) {
        console.error('AFK event without sessionId')
        return
      }
      
      await updateSessionStatus(sessionId, 'afk', ipAddress)
      
      // ✅ ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ ТОЛЬКО ОБ УХОДЕ В АФК
      broadcastStatus(io, socket, user.id, userName, 'afk', {
        sessionId
      })
      
      const onlineUsers = await getOnlineUsers()
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('Error handling afk event:', error)
    }
  })
}
