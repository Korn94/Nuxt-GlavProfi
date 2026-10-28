// server/socket/dev.ts
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import type { NitroApp } from 'nitropack'
import { useRuntimeConfig } from 'nitropack/runtime'
import { setupSocketServer } from './index'
import { 
  resetAllSessions, 
  getSocketOptions, 
  setIO 
} from './common'

/**
 * ✅ P7: порт сокет-сервера берём из runtimeConfig.public.socketPort
 * (nuxt.config.ts, значение по умолчанию 3001) — тот же источник, что и на клиенте
 * (services/socket.service.ts → resolveSocketUrl). Раньше клиент был захардкожен
 * на 3001, а сервер читал process.env.SOCKET_PORT — рассинхрон ломал realtime.
 * Переопределяется переменной NUXT_PUBLIC_SOCKET_PORT.
 */
function resolveSocketPort(): number {
  try {
    const { public: publicConfig } = useRuntimeConfig()
    const port = Number(publicConfig?.socketPort)
    if (Number.isFinite(port) && port > 0) return port
  } catch (error) {
    console.warn('[SocketDev] ⚠️ runtimeConfig недоступен, используем process.env.SOCKET_PORT')
  }

  const fallback = Number(process.env.SOCKET_PORT || 3001)
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 3001
}

export function initSocketDev(nitroApp: NitroApp): void {
  console.log('[SocketDev] 🛠️ Инициализация Socket.IO для разработки...')
  
  let io: Server | null = null
  let httpServer: ReturnType<typeof createServer> | null = null
  
  const SOCKET_PORT = resolveSocketPort()
  const LISTEN_HOST = '0.0.0.0'
  
  try {
    httpServer = createServer()
    
    io = new Server(httpServer, getSocketOptions(true))
    
    // Инициализация сервера сокетов: middleware, обработчики, комнаты
    setupSocketServer(io)
    
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
