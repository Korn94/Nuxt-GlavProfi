// server/socket/handlers/user.ts
import { Socket } from 'socket.io'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { Server } from 'socket.io'
import { getOnlineUsers } from '../../utils/sessions'
import { createSession, updateSessionStatus } from '../../utils/sessions'

/**
* Обработчик событий, связанных с пользователем
*/
export function setupUserHandlers(socket: Socket, user: any, io: Server) {
  console.log(`User connected: ${user.id} (${user.name || user.login})`)
  
  // Создаем сессию при подключении
  socket.on('session:init', async (data) => {
    try {
      const { ipAddress, userAgent } = data
      const session = await createSession(user.id, ipAddress, userAgent)
      
      // Сохраняем sessionId в сокете для последующих операций
      ;(socket as any).sessionId = session?.sessionId
      
      // Получаем обновленный список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      
      // Отправляем обновленный список ВСЕМ подключенным клиентам
      io.emit('online-users:update', onlineUsers)
      
      console.log(`Session created for user ${user.id}: ${session?.sessionId}`)
    } catch (error) {
      console.error('Error initializing session:', error)
    }
  })
  
  // Обработка события обновления пользователя
  socket.on('user:update', async (updatedData) => {
    try {
      // Обновляем данные пользователя в БД
      await db.update(users).set({
        name: updatedData.name || user.name,
      }).where(eq(users.id, user.id))
      
      // Получаем обновленные данные пользователя
      const [updatedUser] = await db
        .select({
          id: users.id,
          name: users.name,
          login: users.login,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, user.id))
      
      // Отправляем обновленные данные всем подключенным клиентам
      if (updatedUser) {
        io.emit('user:update', {
          id: updatedUser.id,
          email: updatedUser.login,
          name: updatedUser.name,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
          isVerified: true
        })
      }
    } catch (error) {
      console.error('Error updating user:', error)
    }
  })
  
  // Обработка отключения
  socket.on('disconnect', async (reason) => {
    console.log(`User disconnected: ${user.id} (${user.name || user.login}) - ${reason}`)
    
    try {
      // Получаем sessionId из сокета
      const sessionId = (socket as any).sessionId
      
      if (sessionId) {
        // Обновляем статус на оффлайн
        await updateSessionStatus(sessionId, 'offline')
        
        // Получаем обновленный список онлайн-пользователей
        const onlineUsers = await getOnlineUsers()
        
        // Отправляем обновленный список ВСЕМ подключенным клиентам
        io.emit('online-users:update', onlineUsers)
        
        console.log(`Session ${sessionId} marked as offline`)
      }
    } catch (error) {
      console.error('Error handling disconnect:', error)
    }
  })
}
