// server/socket/index.ts
import { Server, type Socket } from 'socket.io'
import { socketAuthMiddleware } from './middleware/auth'
import { setupUserHandlers, setupActivityHandlers } from './handlers'
import { setupStatusHandlers } from './handlers/status'

// Глобальное хранилище активных подключений
const activeSockets = new Map<number, Socket>()

/**
 * Инициализация сокет-сервера
 * @param io Экземпляр сервера Socket.IO
 */
export function setupSocketServer(io: Server) {
  // Регистрируем middleware для аутентификации
  io.use(socketAuthMiddleware)
  
  // Обработчик подключения
  io.on('connection', async (socket: Socket) => {
    try {
      const user = (socket as any).user
      
      // Сохраняем сокет в глобальном хранилище
      activeSockets.set(user.id, socket)

      // Регистрируем обработчики событий
      setupUserHandlers(socket, user, io)
      setupActivityHandlers(socket, user, io)
      setupStatusHandlers(socket, user, io)
      
    } catch (error) {
      console.error('Connection error:', error)
      socket.disconnect(true)
    }
  })
  
  console.log('Socket.IO handlers registered')
}
