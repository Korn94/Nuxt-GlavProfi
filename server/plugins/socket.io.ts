// server/plugins/socket.io.ts
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { defineNitroPlugin } from 'nitropack/runtime/plugin'
import { setupSocketServer } from '../socket'
import { db } from '../db'
import { userSessions } from '../db/schema'

// ✅ ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ДЛЯ ДОСТУПА К IO ИЗ API-РОУТОВ
let globalIO: Server | null = null

export default defineNitroPlugin((nitroApp) => {
  console.log('[SocketPlugin] Initializing Socket.IO...')
  
  let io: import('socket.io').Server | null = null
  let socketHttpServer: import('node:http').Server | null = null
  
  const isDev = process.env.NODE_ENV !== 'production'
  
  // ✅ Получаем хост для прослушивания (0.0.0.0 для доступа извне)
  const listenHost = isDev ? '0.0.0.0' : 'localhost'
  
  if (isDev) {
    // В dev-режиме создаём отдельный HTTP-сервер для Socket.IO
    socketHttpServer = createServer()
    
    io = new Server(socketHttpServer, {
      path: '/socket.io',
      cors: {
        // ✅ РАЗРЕШАЕМ ВСЕ ORIGIN В DEV-РЕЖИМЕ
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
        allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000
    })
    
    // ✅ СБРАСЫВАЕМ ВСЕ СЕССИИ ПРИ СТАРТЕ СЕРВЕРА
    ;(async () => {
      try {
        console.log('[SocketPlugin] 🔄 Resetting all user sessions to offline...')
        const result = await db
          .update(userSessions)
          .set({ status: 'offline' })
          .execute()
        
        const affectedRows = (result as any)[0]?.affectedRows || 0
        console.log(`[SocketPlugin] ✅ All sessions reset to offline (affected ${affectedRows} rows)`)
      } catch (error) {
        console.error('[SocketPlugin] ❌ Error resetting sessions:', error)
      }
    })()
    
    setupSocketServer(io)
    
    const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || '3001', 10)
    
    // ✅ ИСПРАВЛЕНИЕ: Слушаем на 0.0.0.0 для доступа из локальной сети
    socketHttpServer.listen(SOCKET_PORT, listenHost, () => {
      console.log(`[SocketPlugin] Socket.IO server running on http://${listenHost}:${SOCKET_PORT}`)
      console.log(`[SocketPlugin] Accessible from: http://localhost:${SOCKET_PORT} or http://192.168.31.244:${SOCKET_PORT}`)
    })
    
    // ✅ СОХРАНЯЕМ В ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ
    globalIO = io
    // @ts-ignore
    nitroApp.io = io
    
    nitroApp.hooks.hook('close', async () => {
      console.log('[SocketPlugin] Closing Socket.IO server...')
      try {
        if (io) {
          await io.close()
          console.log('[SocketPlugin] ✅ Socket.IO server closed')
        }
        if (socketHttpServer) {
          await new Promise<void>((resolve) => {
            socketHttpServer!.close(() => {
              console.log('[SocketPlugin] ✅ HTTP server closed')
              resolve()
            })
          })
        }
      } catch (error) {
        console.error('[SocketPlugin] ❌ Error closing servers:', error)
      }
    })
    
  } else {
    // В продакшене используем обычный метод
    io = new Server({
      path: '/socket.io',
      cors: {
        // ✅ В продакшене указываем конкретный origin
        origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
        allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000
    })
    
    // ✅ СБРАСЫВАЕМ ВСЕ СЕССИИ ПРИ СТАРТЕ СЕРВЕРА
    ;(async () => {
      try {
        console.log('[SocketPlugin] 🔄 Resetting all user sessions to offline...')
        const result = await db
          .update(userSessions)
          .set({ status: 'offline' })
          .execute()
        
        const affectedRows = (result as any)[0]?.affectedRows || 0
        console.log(`[SocketPlugin] ✅ All sessions reset to offline (affected ${affectedRows} rows)`)
      } catch (error) {
        console.error('[SocketPlugin] ❌ Error resetting sessions:', error)
      }
    })()
    
    // ✅ СОХРАНЯЕМ В ГЛОБАЛЬНУЮ ПЕРЕМЕННУЮ
    globalIO = io
    // @ts-ignore
    nitroApp.io = io
    
    setupSocketServer(io)
    console.log('[SocketPlugin] ✅ Socket.IO initialized for production')
    
    nitroApp.hooks.hook('close', async () => {
      console.log('[SocketPlugin] Closing Socket.IO server...')
      try {
        if (io) {
          await io.close()
          console.log('[SocketPlugin] ✅ Socket.IO server closed')
        }
      } catch (error) {
        console.error('[SocketPlugin] ❌ Error closing Socket.IO server:', error)
      }
    })
  }
  
  console.log('[SocketPlugin] ✅ Socket.IO plugin initialized')
})

// ✅ ЭКСПОРТИРУЕМ ФУНКЦИЮ ДЛЯ ДОСТУПА К IO ИЗ API-РОУТОВ
export function getIO(): Server | null {
  return globalIO
}
