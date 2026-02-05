// server/socket/handlers/activity.ts
import type { Socket, Server } from 'socket.io'
import { updateSessionStatus, getOnlineUsers } from '../../utils/sessions' // ✅ Импортируем правильную функцию

export function setupActivityHandlers(socket: Socket, user: any, io: Server) {
    socket.on('activity', async (data) => {
        try {
            const { sessionId, status, ipAddress } = data
            if (!sessionId) {
                console.error('Activity event without sessionId')
                return
            }
            await updateSessionStatus(sessionId, status, ipAddress)
            
            // ✅ Используем функцию с данными пользователя
            const onlineUsers = await getOnlineUsers()
            io.emit('online-users:update', onlineUsers)
        } catch (error) {
            console.error('Error handling activity event:', error)
        }
    })

    socket.on('activity:resume', async (data) => {
        try {
            const { sessionId, ipAddress } = data
            if (!sessionId) {
                console.error('Resume event without sessionId')
                return
            }
            await updateSessionStatus(sessionId, 'online', ipAddress)
            
            // ✅ Используем функцию с данными пользователя
            const onlineUsers = await getOnlineUsers()
            io.emit('online-users:update', onlineUsers)
        } catch (error) {
            console.error('Error handling resume event:', error)
        }
    })

    socket.on('activity:afk', async (data) => {
        try {
            const { sessionId, ipAddress } = data
            if (!sessionId) {
                console.error('AFK event without sessionId')
                return
            }
            await updateSessionStatus(sessionId, 'afk', ipAddress)
            
            // ✅ Используем функцию с данными пользователя
            const onlineUsers = await getOnlineUsers()
            io.emit('online-users:update', onlineUsers)
        } catch (error) {
            console.error('Error handling afk event:', error)
        }
    })
}
