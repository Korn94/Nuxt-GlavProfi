// server/socket/common.ts
import { Server, Socket } from 'socket.io'
import { db } from '../db'
import { userSessions } from '../db/schema'
import { verifyToken } from '../utils/jwt'
import { eq } from 'drizzle-orm'

// ✅ ГЛОБАЛЬНАЯ ПЕРЕМЕННАЯ ДЛЯ ДОСТУПА К IO ИЗ API-РОУТОВ
let globalIO: Server | null = null

/**
 * Получение экземпляра Socket.IO для использования в API-роутах
 */
export function getIO(): Server | null {
  return globalIO
}

/**
 * Установка глобального экземпляра IO
 * @internal
 */
export function setIO(io: Server): void {
  globalIO = io
}

/**
 * Сброс всех сессий в статус "offline" при старте сервера
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

/**
 * Базовая настройка обработчиков событий сокета
 */
export function setupSocketHandlers(io: Server): void {
  // Обработчик подключения
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

/**
 * Общие настройки CORS для Socket.IO
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

/**
 * Общие настройки Socket.IO
 * ✅ ПРОСТОЙ ВАРИАНТ: без сложной типизации, только то, что нужно
 */
export function getSocketOptions(isDev: boolean) {
  return {
    path: '/socket.io',
    cors: getCorsConfig(isDev),
    // ✅ FIX: явное приведение к нужному типу
    transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6
  }
}
