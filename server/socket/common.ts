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
import { Server, Socket } from 'socket.io'
import { db } from '../db'
import { userSessions } from '../db/schema'
import { verifyToken } from '../utils/jwt'
import { eq } from 'drizzle-orm'

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

/**
 * Проверить, инициализирован ли Socket.IO server
 *
 * Удобно для быстрого флага в условиях без получения инстанса:
 *   if (isSocketReady()) {
 *     notifyUsers()
 *   }
 */
export function isSocketReady(): boolean {
  return globalIO !== null
}

/**
 * Сбросить инстанс (используется в тестах)
 *
 * @internal Только для тестов
 */
export function resetIO(): void {
  globalIO = null
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

/**
 * Базовая настройка обработчиков событий сокета
 *
 * Регистрирует стандартные обработчики:
 * - connection: логирование подключений
 * - disconnect: логирование отключений
 * - error: логирование ошибок
 *
 * Специфичные обработчики (permissions, boards и т.д.)
 * регистрируются в отдельных модулях handlers/
 */
export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[SocketCommon] 🔗 Подключён клиент: ${socket.id}`)

    socket.on('disconnect', (reason) => {
      console.log(`[SocketCommon] 🔌 Отключён клиент ${socket.id}: ${reason}`)
    })

    socket.on('error', (error: Error) => {
      console.error(`[SocketCommon] ❌ Ошибка сокета ${socket.id}:`, error)
    })
  })
}

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
        'http://192.168.31.244:3000', // Локальный IP для тестирования в LAN
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
