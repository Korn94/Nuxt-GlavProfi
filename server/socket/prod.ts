// server/socket/prod.ts

import { Server } from "socket.io"
import { createRequire } from "node:module"
import type { NitroApp } from "nitropack"
import { setupSocketServer } from "./index"
import {
  resetAllSessions,
  getSocketOptions,
  setIO
} from "./common"

const require = createRequire(import.meta.url)

export function initSocketProd(nitroApp: NitroApp): void {
  console.log('[SocketProd] 🚀 Инициализация Socket.IO для продакшена...')

  let io: Server | null = null

  const attachSocket = (nodeServer: any): boolean => {
    if (io) return true
    if (!nodeServer) return false
    try {
      console.log('[SocketProd] 🔧 Привязываем Socket.IO к серверу...')
      
      // ✅ Сохраняем существующие upgrade listeners ДО того как Socket.IO добавит свой
      const existingUpgradeListeners = nodeServer.listeners('upgrade').slice()
      
      io = new Server(nodeServer, getSocketOptions(false))
      
      // ✅ Удаляем Nitro's upgrade listeners — они закрывают WS соединение
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
  // СПОСОБ 1: Monkey-patch через require('http')
  // ============================================
  try {
    const httpModule = require('http')
    const originalCreateServer = httpModule.createServer

    httpModule.createServer = function (...args: any[]) {
      const server = originalCreateServer.apply(this, args)

      if (!io) {
        const originalListen = server.listen

        server.listen = function (...listenArgs: any[]) {
          const result = originalListen.apply(this, listenArgs)

          if (!io) {
            console.log('[SocketProd] 🎯 Перехвачен http.Server через monkey-patch!')
            httpModule.createServer = originalCreateServer
            attachSocket(server)
          }

          return result
        }
      }

      return server
    }

    console.log('[SocketProd] ✅ Monkey-patch на http.createServer применён')
  } catch (err) {
    console.error('[SocketProd] ❌ Ошибка monkey-patch:', err)
  }

  // ============================================
  // СПОСОБ 2: Хуки Nitro
  // ============================================
  for (const hookName of ['listen', 'listen:node', 'nitro:listen']) {
    // @ts-ignore
    nitroApp.hooks.hook(hookName, (serverArg: any) => {
      if (io) return
      console.log(`[SocketProd] 🎯 Хук "${hookName}" сработал`)
      if (serverArg && typeof serverArg.listen === 'function') {
        attachSocket(serverArg)
      }
    })
  }

  // ============================================
  // СПОСОБ 3: Первый HTTP запрос
  // ============================================
  // @ts-ignore
  nitroApp.hooks.hook('request', (event: any) => {
    if (io) return
    const nodeServer = event?.node?.req?.socket?.server
    if (nodeServer) {
      console.log('[SocketProd] 🎯 Сервер найден через request hook!')
      attachSocket(nodeServer)
    }
  })

  console.log('[SocketProd] ✅ Все способы зарегистрированы')
  console.log('[SocketProd] 📋 nitroApp keys:', Object.keys(nitroApp))
}
