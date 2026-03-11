// server/socket/dev.ts
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import type { NitroApp } from 'nitropack'
import { setupSocketServer } from './index'
import { 
  resetAllSessions, 
  setupSocketHandlers, 
  getSocketOptions, 
  setIO 
} from './common'

/**
 * Инициализация Socket.IO для разработки
 * ✅ Экспортируем как обычную функцию, а не defineNitroPlugin
 */
export function initSocketDev(nitroApp: NitroApp): void {
  console.log('[SocketDev] 🛠️ Инициализация Socket.IO для разработки...')
  
  let io: Server | null = null
  let httpServer: ReturnType<typeof createServer> | null = null
  
  const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || '3001', 10)
  const LISTEN_HOST = '0.0.0.0'
  
  try {
    httpServer = createServer()
    
    io = new Server(httpServer, getSocketOptions(true))
    
    setupSocketHandlers(io)
    setupSocketServer(io)
    
    // Сброс сессий (не блокируем инициализацию)
    resetAllSessions().catch(console.error)
    
    setIO(io)
    // @ts-ignore
    nitroApp.io = io
    
    httpServer.listen(SOCKET_PORT, LISTEN_HOST, () => {
      console.log(`[SocketDev] ✅ Socket.IO запущен на http://${LISTEN_HOST}:${SOCKET_PORT}`)
    })
    
    nitroApp.hooks.hook('close', async () => {
      console.log('[SocketDev] 🧹 Закрытие сервера сокетов...')
      try {
        if (io) await io.close()
        if (httpServer) {
          await new Promise<void>((resolve) => {
            httpServer!.close(() => resolve())
          })
        }
      } catch (error) {
        console.error('[SocketDev] ❌ Ошибка при закрытии:', error)
      }
    })
    
  } catch (error) {
    console.error('[SocketDev] ❌ Критическая ошибка:', error)
    throw error
  }
  
  console.log('[SocketDev] ✅ Плагин инициализирован')
}
