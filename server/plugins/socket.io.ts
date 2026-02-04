// server/plugins/socket.io.ts
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { Server } from 'socket.io'
import { setupSocketServer } from '../socket'

export default defineNitroPlugin((nitroApp) => {
  // Инициализируем Socket.IO
  const io = new Server({
    cors: {
      origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true
  })

  // Сохраняем io в контекст приложения
  // @ts-ignore - расширяем nitroApp
  nitroApp.io = io

  // Хук для подключения к серверу при первом запросе
  nitroApp.hooks.hook('request', (event: any) => {
    // @ts-ignore - проверяем наличие сервера
    if (!io.httpServer && event.node.req.socket?.server) {
      // @ts-ignore - подключаем к серверу
      io.attach(event.node.req.socket.server)
      setupSocketServer(io)
      console.log('✅ Socket.IO attached via request hook')
    }
  })

  // Закрываем сервер при остановке приложения
  nitroApp.hooks.hook('close', async () => {
    io.close()
    console.log('🔌 Socket.IO server closed')
  })

  console.log('✅ Socket.IO plugin initialized')
})
