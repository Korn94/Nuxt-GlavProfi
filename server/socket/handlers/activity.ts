// server/socket/handlers/activity.ts
import type { Socket, Server } from 'socket.io'
import { updateSessionStatus, getOnlineUsers } from '../../utils/sessions'

/**
* Обработчик событий активности пользователя
*/
export function setupActivityHandlers(socket: Socket, user: any, io: Server) {
  // Обработка события активности
  socket.on('activity', async (data) => {
    try {
      const { sessionId, status, ipAddress } = data
      if (!sessionId) {
        console.error('Activity event without sessionId')
        return
      }
      
      // Обновляем статус сессии
      await updateSessionStatus(sessionId, status, ipAddress)
      
      // Получаем обновленный список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      
      // Отправляем обновленный список всем подключенным клиентам
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('Error handling activity event:', error)
    }
  })
  
  // Обработка события "пользователь вернулся из АФК"
  socket.on('activity:resume', async (data) => {
    try {
      const { sessionId, ipAddress } = data
      if (!sessionId) {
        console.error('Resume event without sessionId')
        return
      }
      
      // Обновляем статус на онлайн
      await updateSessionStatus(sessionId, 'online', ipAddress)
      
      // Получаем обновленный список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      
      // Отправляем обновленный список всем подключенным клиентам
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('Error handling resume event:', error)
    }
  })
  
  // Обработка события "пользователь ушел в АФК"
  socket.on('activity:afk', async (data) => {
    try {
      const { sessionId, ipAddress } = data
      if (!sessionId) {
        console.error('AFK event without sessionId')
        return
      }
      
      // Обновляем статус на АФК
      await updateSessionStatus(sessionId, 'afk', ipAddress)
      
      // Получаем обновленный список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      
      // Отправляем обновленный список всем подключенным клиентам
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('Error handling afk event:', error)
    }
  })
}
