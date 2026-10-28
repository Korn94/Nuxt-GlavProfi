// server/socket/common.ts
/**
 * 📡 Общий модуль для работы с Socket.IO на сервере
 *
 * Назначение:
 * - Хранит единственный экземпляр Socket.IO server instance (singleton)
 * - Предоставляет API для использования в API endpoints и хендлерах
 * - Содержит общие настройки CORS, опций сокета, базовые обработчики
 * - Управляет сессиями пользователей при старте сервера
 *
 * Архитектура:
 * - Инициализация происходит в server/plugins/socket.ts при старте сервера
 * - Все API endpoints импортируют getIO() для отправки событий
 * - Singleton-паттерн: один инстанс на весь серверный процесс
 *
 * Использование:
 *   import { getIO } from '~/server/socket/common'
 *   const io = getIO()
 *   if (io) {
 *     io.to('room').emit('event', data)
 *   }
 */
import { Server } from 'socket.io'
import { db } from '../db'
import { userSessions } from '../db/schema'

// ============================================
// СОСТОЯНИЕ (singleton)
// ============================================

/**
 * Единственный экземпляр Socket.IO server.
 * Устанавливается в server/plugins/socket.ts при старте сервера.
 * До инициализации — null (SSR, тесты, ранние вызовы).
 */
let globalIO: Server | null = null

// ============================================
// ПУБЛИЧНЫЙ API: ДОСТУП К ИНСТАНСУ
// ============================================

/**
 * Установить экземпляр Socket.IO (вызывается один раз при старте сервера)
 *
 * @internal Используется только в server/plugins/socket.ts
 */
export function setIO(io: Server): void {
  if (globalIO) {
    console.warn('[SocketCommon] ⚠️ setIO() вызван повторно — предыдущий инстанс будет заменён')
  }
  globalIO = io
  console.log('[SocketCommon] ✅ Socket.IO server инициализирован')
}

/**
 * Получить текущий экземпляр Socket.IO server
 *
 * Возвращает null если сервер ещё не инициализирован:
 * - Во время SSR
 * - В тестах без mock
 * - При очень ранних вызовах (до запуска плагина)
 *
 * Паттерн использования — всегда проверять на null:
 *   const io = getIO()
 *   if (io) {
 *     io.emit('event', data)
 *   }
 */
export function getIO(): Server | null {
  return globalIO
}

// ============================================
// УПРАВЛЕНИЕ СЕССИЯМИ
// ============================================

/**
 * Сброс всех сессий в статус "offline" при старте сервера
 *
 * Вызывается при инициализации сервера, чтобы гарантировать,
 * что после перезагрузки процесса у всех пользователей корректный статус.
 * Реальное состояние будет восстановлено при подключении клиентов.
 */
export async function resetAllSessions(): Promise<void> {
  try {
    console.log('[SocketCommon] 🔄 Сброс всех сессий в offline...')
    const result = await db
      .update(userSessions)
      .set({ status: 'offline' })
      .execute()

    const affectedRows = (result as any)[0]?.affectedRows || 0
    console.log(`[SocketCommon] ✅ Сессии сброшены (затронуто строк: ${affectedRows})`)
  } catch (error) {
    console.error('[SocketCommon] ❌ Ошибка при сбросе сессий:', error)
  }
}

// ============================================
// БАЗОВЫЕ ОБРАБОТЧИКИ СОКЕТОВ
// ============================================

// ============================================
// КОНФИГУРАЦИЯ CORS
// ============================================

/**
 * Общие настройки CORS для Socket.IO
 *
 * В dev-режиме: разрешены все origins (для удобства разработки)
 * В production: whitelist конкретных доменов
 *
 * @param isDev — флаг режима разработки
 */
export function getCorsConfig(isDev: boolean) {
  if (isDev) {
    return {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
    }
  }

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowedOrigins = [
        process.env.NUXT_PUBLIC_SITE_URL,
        'http://localhost:3000',
        'https://glavprofi.ru',
        'https://www.glavprofi.ru'
      ].filter(Boolean) as string[]

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        console.warn(`[SocketCommon] 🚫 Blocked origin: ${origin}`)
        callback(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With']
  }
}

// ============================================
// ОПЦИИ SOCKET.IO
// ============================================

/**
 * Общие настройки Socket.IO
 *
 * Ключевые решения:
 * - `perMessageDeflate: false` — отключено, т.к. часто ломает WS через nginx proxy
 * - `transports: ['websocket', 'polling']` — приоритет у WebSocket, fallback на polling
 *   ⚠️ fallback работает только если клиент передаёт `tryAllTransports: true`
 *   (см. services/socket.service.ts): engine.io без него использует лишь transports[0]
 * - `pingTimeout: 120000` — увеличен для медленных мобильных сетей
 * - `allowEIO3: true` — поддержка старых клиентов Socket.IO 3.x
 *
 * @param isDev — флаг режима разработки
 */
export function getSocketOptions(isDev: boolean) {
  return {
    path: '/socket.io',
    cors: getCorsConfig(isDev),
    transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
    allowUpgrades: true,
    allowEIO3: true,
    pingTimeout: 120000,
    pingInterval: 45000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    // Отключаем сжатие — часто ломает WS через nginx proxy
    perMessageDeflate: false
  }
}
