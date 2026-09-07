// server/socket/prod.ts
import { Server } from "socket.io"
import type { NitroApp } from "nitropack"
import type { H3Event } from "h3"
import { setupSocketServer } from "./index"
import {
  resetAllSessions,
  getSocketOptions,
  setIO
} from "./common"

export function initSocketProd(nitroApp: NitroApp): void {
  console.log('[SocketProd] 🚀 Инициализация Socket.IO для продакшена...')

  let io: Server | null = null
  let attachAttempted = false

  const attachSocket = (nodeServer: any): boolean => {
    if (io) return true
    if (!nodeServer) return false

    try {
      console.log('[SocketProd] 🔧 Привязываем Socket.IO к серверу...')
      
      const existingUpgradeListeners = nodeServer.listeners('upgrade').slice()
      io = new Server(nodeServer, getSocketOptions(false))
      
      for (const listener of existingUpgradeListeners) {
        nodeServer.removeListener('upgrade', listener)
      }
      
      console.log('[SocketProd] 🔧 Upgrade listeners после чистки:', nodeServer.listenerCount('upgrade'))
      
      setupSocketServer(io)
      resetAllSessions().catch(console.error)
      setIO(io)
      // @ts-ignore
      nitroApp.io = io

      console.log('[SocketProd] ✅ Socket.IO успешно привязан!')

      nitroApp.hooks.hook('close', async () => {
        if (io) await io.close().catch(console.error)
      })

      return true
    } catch (error) {
      console.error('[SocketProd] ❌ Ошибка привязки:', error)
      return false
    }
  }

  // ============================================
  // ЕДИНСТВЕННЫЙ СПОСОБ: Runtime-хук "request"
  // ============================================
  // Этот хук гарантированно есть в NitroRuntimeHooks.
  // Он вызывается при КАЖДОМ HTTP-запросе, и мы используем его для инициализации
  // Socket.IO при первом же запросе к серверу.
  nitroApp.hooks.hook('request', (event: H3Event) => {
    if (io) return
    if (attachAttempted) return
    
    attachAttempted = true

    // @ts-ignore — свойство .server существует в runtime (это HTTP-сервер Node.js),
    // но отсутствует в официальных типах @types/node и h3.
    const nodeServer = event?.node?.req?.socket?.server
    
    if (nodeServer && typeof nodeServer.on === 'function') {
      console.log('[SocketProd] 🎯 Сервер найден через request hook!')
      attachSocket(nodeServer)
    } else {
      console.warn('[SocketProd] ⚠️ Сервер не найден в первом запросе, ждём следующего...')
      attachAttempted = false
    }
  })

  console.log('[SocketProd] ✅ Runtime hooks зарегистрированы')
}
