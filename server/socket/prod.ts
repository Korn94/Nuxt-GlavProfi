// server/socket/prod.ts

import { Server } from "socket.io"
import type { NitroApp } from "nitropack"
import {
  resetAllSessions,
  setupSocketHandlers,
  getSocketOptions,
  setIO
} from "./common"

export function initSocketProd(nitroApp: NitroApp): void {
  console.log('[SocketProd] 🚀 Инициализация Socket.IO для продакшена...')
  
  let io: Server | null = null
  
  // ✅ Функция привязки сокета
  const attachSocket = (nodeServer: any) => {
    try {
      io = new Server(nodeServer, getSocketOptions(false))
      setupSocketHandlers(io)
      resetAllSessions().catch(console.error)
      setIO(io)
      // @ts-ignore
      nitroApp.io = io
      console.log('[SocketProd] ✅ Socket.IO привязан к серверу Nitro (порт 3000)')
      
      nitroApp.hooks.hook('close', async () => {
        console.log('[SocketProd] 🧹 Закрытие Socket.IO...')
        try {
          if (io) await io.close()
          console.log('[SocketProd] ✅ Socket.IO закрыт')
        } catch (error) {
          console.error('[SocketProd] ❌ Ошибка при закрытии:', error)
        }
      })
      return true
    } catch (error) {
      console.error('[SocketProd] ❌ Ошибка привязки:', error)
      return false
    }
  }
  
  // ✅ Попытка 1: Прямой доступ к серверу
  const nodeServer = 
    (nitroApp as any).nodeServer ||
    (nitroApp as any).server ||
    (nitroApp as any).h3App?.node?.server ||
    (nitroApp as any).h3App?._node?.server ||
    (globalThis as any).__nitro_server ||
    (globalThis as any).__server
  
  if (nodeServer) {
    console.log('[SocketProd] 🎯 Сервер найден напрямую')
    if (attachSocket(nodeServer)) return
  }
  
  // ✅ Попытка 2: Хук (на случай, если сработает позже)
  console.log('[SocketProd] ⏳ Ожидание сервера через хук...')
  ;(nitroApp.hooks.hook as any)('nitro:server:created', (server: any) => {
    console.log('[SocketProd] 🎯 Сервер создан через хук')
    attachSocket(server)
  })
  
  // ✅ Попытка 3: Retry-логика (проверяем каждые 100мс до 5 раз)
  let attempts = 0
  const maxAttempts = 50  // 5 секунд
  const retryInterval = setInterval(() => {
    attempts++
    
    const fallbackServer = 
      (nitroApp as any).h3App?.node?.server ||
      (globalThis as any).__nitro_app?.h3App?.node?.server
    
    if (fallbackServer && !io) {
      console.log(`[SocketProd] 🎯 Сервер найден через retry (попытка ${attempts})`)
      clearInterval(retryInterval)
      attachSocket(fallbackServer)
      return
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(retryInterval)
      console.warn('[SocketProd] ⚠️ Не удалось найти сервер после 50 попыток')
      console.warn('[SocketProd] ⚠️ WebSocket может не работать, polling должен работать через h3-роутер')
    }
  }, 100)
  
  console.log('[SocketProd] ✅ Плагин зарегистрирован')
}
