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
  // Кол-во неудачных попыток привязки (bounded retry + понятные логи)
  let attachAttempts = 0
  // Терминальный флаг: лимит попыток исчерпан — больше не пробуем и не пишем в логи
  let attachFailed = false
  // Защита от повторного входа, пока идёт одна попытка (attachSocket синхронный)
  let attachAttempted = false

  /** Сколько раз пробуем привязать Socket.IO, прежде чем признать провал */
  const MAX_ATTACH_ATTEMPTS = 3

  const attachSocket = (nodeServer: any): boolean => {
    if (io) return true
    if (!nodeServer) return false

    try {
      // Инфо-лог только на первой попытке — при ретраях не спамим
      if (attachAttempts === 0) {
        console.log('[SocketProd] 🔧 Привязываем Socket.IO к серверу...')
      }
      
      // ⚠️ КРИТИЧНО (связка с nitro.experimental.websocket: true):
      // node-server entry Nitro регистрирует на http-сервере свой crossws-обработчик
      // 'upgrade' (server.on("upgrade", handleUpgrade)) ещё ДО первого запроса.
      // Удалять его ОБЯЗАТЕЛЬНО: для путей без h3-websocket-обработчика crossws не отдаёт 404,
      // а сам завершает WS-рукопожатие (AdapterHookable.upgrade → {} без endResponse →
      // nodeAdapter → wss.handleUpgrade). Листенеры 'upgrade' вызываются в порядке регистрации,
      // поэтому crossws «съел» бы апгрейд на /socket.io/, а engine.io упал бы при повторном
      // handshake того же сокета. Снимаем ТОЛЬКО листенеры, существовавшие ДО new Server(...):
      // свой листенер Socket.IO добавлен позже и должен остаться.
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
      // Отправляем в общий обработчик ошибок Nitro (server/plugins/error-handler.ts),
      // иначе провал attach виден только в stdout и «тихо» ломает realtime.
      nitroApp.captureError(error instanceof Error ? error : new Error(String(error)), {
        tags: ['socket-prod', 'attach']
      })
      // Сбрасываем частично созданный инстанс: иначе повторная попытка упрётся в `if (io) return true`
      io = null
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
    if (attachFailed) return
    if (attachAttempted) return
    
    attachAttempted = true

    // Достаём http-сервер Nitro из сокета запроса.
    // `.server` есть в runtime, но отсутствует в типах h3 и @types/node.
    // @ts-ignore
    const nodeServer = event?.node?.req?.socket?.server
    
    if (nodeServer && typeof nodeServer.on === 'function') {
      console.log('[SocketProd] 🎯 Сервер найден через request hook!')
      const attached = attachSocket(nodeServer)
      attachAttempted = false

      if (attached) return

      // Провал привязки: разрешаем повтор на следующем запросе, но не бесконечно.
      attachAttempts++
      if (attachAttempts >= MAX_ATTACH_ATTEMPTS) {
        attachFailed = true
        console.error(
          `[SocketProd] ❌ Socket.IO не привязан за ${attachAttempts} попытки(ок) — ` +
          'realtime будет недоступен до перезапуска процесса. Проверьте логи выше.'
        )
      } else {
        console.warn(
          `[SocketProd] ⚠️ Попытка привязки ${attachAttempts}/${MAX_ATTACH_ATTEMPTS} не удалась — ` +
          'повторим на следующем запросе'
        )
      }
    } else {
      console.warn('[SocketProd] ⚠️ Сервер не найден в первом запросе, ждём следующего...')
      attachAttempted = false
    }
  })

  console.log('[SocketProd] ✅ Runtime hooks зарегистрированы')
}
