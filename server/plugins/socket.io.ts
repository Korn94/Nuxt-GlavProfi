// server/plugins/socket.io.ts
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { setupSocketServer } from '../socket'

export default defineNitroPlugin((nitroApp) => {
  console.log('[SocketPlugin] Initializing Socket.IO...')

  let io: import('socket.io').Server | null = null

  // ✅ Проверяем, запущен ли режим разработки
  const isDev = process.env.NODE_ENV !== 'production'

  if (isDev) {
    // В dev-режиме создаём отдельный HTTP-сервер для Socket.IO
    const socketHttpServer = createServer()
    io = new Server(socketHttpServer, {
      path: '/socket.io',
      cors: {
        origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000
    })

    setupSocketServer(io)

    // ✅ Запускаем сервер Socket.IO на отдельном порту
    const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || '3001', 10)
    socketHttpServer.listen(SOCKET_PORT, () => {
      console.log(`[SocketPlugin] Socket.IO server running on http://localhost:${SOCKET_PORT}`)
    })

    // @ts-ignore
    nitroApp.io = io

    // Закрытие при завершении работы
    nitroApp.hooks.hook('close', async () => {
      console.log('[SocketPlugin] Closing Socket.IO server...')
      if (io) {
        await io.close()
        console.log('[SocketPlugin] ✅ Socket.IO server closed')
      }
    })

  } else {
    // В продакшене используем обычный метод (через listen hook)
    io = new Server({
      path: '/socket.io',
      cors: {
        origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000
    })

    // @ts-ignore
    nitroApp.io = io

    nitroApp.hooks.hook('listen', (server: any) => {
      console.log('[SocketPlugin] Attaching Socket.IO to main server...')
      io!.attach(server)
      setupSocketServer(io!)
      console.log('[SocketPlugin] ✅ Socket.IO attached to main server')
    })

    nitroApp.hooks.hook('close', async () => {
      console.log('[SocketPlugin] Closing Socket.IO server...')
      if (io) {
        await io.close()
        console.log('[SocketPlugin] ✅ Socket.IO server closed')
      }
    })
  }

  console.log('[SocketPlugin] ✅ Socket.IO plugin initialized')
})
