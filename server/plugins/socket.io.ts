// server/plugins/socket.io.ts
import { Server } from 'socket.io'
import { setupSocketServer } from '../socket'

export default async (nitroApp: any) => {
  // Создаем экземпляр Socket.IO
  const io = new Server({
    cors: {
      origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true
  })

  // ПРИКРЕПЛЯЕМ Socket.IO К СЕРВЕРУ ПРАВИЛЬНО
  // В режиме разработки и продакшена
  if (process.env.NODE_ENV === 'production') {
    io.attach(nitroApp.h3App.nodeServer)
    console.log('✅ Socket.IO attached to production server')
  } else {
    // Для режима разработки используем хук 'render:response'
    nitroApp.hooks.hook('render:response', () => {
      if (!nitroApp.io) {
        io.attach(nitroApp.h3App.nodeServer)
        console.log('✅ Socket.IO attached to dev server')
        nitroApp.io = io
      }
    })
  }

  // Инициализируем сокет-сервер с хендлерами
  setupSocketServer(io)

  // Сохраняем io в контексте приложения для доступа из других файлов
  nitroApp.io = io

  // Экспортируем функцию для отправки событий из обработчиков API
  nitroApp.ioSend = (event: string, data: any) => {
    io.emit(event, data)
  }

  console.log('✅ Socket.IO server initialized')
}
