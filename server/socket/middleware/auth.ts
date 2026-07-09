// server/socket/middleware/auth.ts
/**
 * Middleware для аутентификации Socket.IO подключений
 * 
 * Архитектура:
 * - Извлечение токена из разных источников (auth, query, headers)
 * - Проверка JWT токена
 * - Загрузка пользователя из БД
 * - Сохранение пользователя в socket.data для последующего использования
 * - Детальное логирование для отладки
 */

import { verifyToken } from '../../utils/jwt'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { Socket } from 'socket.io'
import { createError } from 'h3'

/**
 * Интерфейс данных пользователя для сокета
 */
export interface SocketUser {
  id: number
  email: string
  role: string
  name: string
  createdAt: Date | string
  updatedAt: Date | string
  isVerified: boolean
}

/**
 * Проверка токена и аутентификация пользователя
 * @param token JWT токен
 * @returns Данные пользователя при успешной аутентификации
 * @throws Error при ошибке аутентификации
 */
export async function authenticateUser(token: string): Promise<SocketUser> {
  try {
    // ✅ Логирование начала проверки (без токена!)
    console.log('[SocketAuth] 🔐 Проверка токена...')
    
    // Проверяем токен JWT
    const payload = await verifyToken(token)
    
    if (!payload?.id) {
      console.warn('[SocketAuth] ❌ Токен не содержит ID пользователя')
      throw new Error('Invalid token payload')
    }
    
    console.log(`[SocketAuth] ✅ Токен валиден, userId: ${payload.id}`)
    
    // Проверяем существование пользователя в БД
    // ✅ ДОБАВЛЕНО (P1.5): проверка на блокировку и удаление пользователя
    const [user] = await db
      .select({
        id: users.id,
        login: users.login,
        name: users.name,
        role: users.role,
        isBlocked: users.isBlocked,
        deletedAt: users.deletedAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1)
    
    if (!user) {
      console.warn(`[SocketAuth] ❌ Пользователь ${payload.id} не найден в БД`)
      throw new Error('User not found')
    }
    
    // ✅ ПРОВЕРКА НА БЛОКИРОВКУ
    if (user.isBlocked) {
      console.warn(`[SocketAuth] ❌ Пользователь ${payload.id} заблокирован`)
      throw new Error('Account is blocked')
    }
    
    // ✅ ПРОВЕРКА НА SOFT-DELETE
    if (user.deletedAt) {
      console.warn(`[SocketAuth] ❌ Пользователь ${payload.id} удалён (soft-delete)`)
      throw new Error('Account deleted')
    }
    
    console.log(`[SocketAuth] ✅ Пользователь аутентифицирован: ${user.login}`)
    
    return {
      id: user.id,
      email: user.login,
      role: user.role,
      name: user.name || user.login,
      createdAt: user.createdAt ?? new Date().toISOString(),
      updatedAt: user.updatedAt ?? new Date().toISOString(),
      isVerified: true
    }
  } catch (error) {
    console.error('[SocketAuth] ❌ Ошибка аутентификации:', error instanceof Error ? error.message : error)
    
    if (error instanceof Error && error.message === 'User not found') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Пользователь не найден'
      })
    }
    
    if (error instanceof Error && error.message === 'Account is blocked') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Аккаунт заблокирован'
      })
    }
    
    if (error instanceof Error && error.message === 'Account deleted') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Аккаунт удалён'
      })
    }
    
    if (error instanceof Error && error.message.includes('token')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Неверный или истёкший токен'
      })
    }
    
    throw createError({
      statusCode: 401,
      statusMessage: 'Ошибка аутентификации'
    })
  }
}

/**
 * Middleware для проверки аутентификации Socket.IO подключения
 * 
 * @param socket - Экземпляр сокета
 * @param next - Callback для продолжения обработки
 */
export async function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    // ✅ ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ВХОДЯЩИХ ДАННЫХ (без токена!)
    // console.log('[SocketAuth] 🔍 Проверка подключения сокета:', {
    //   socketId: socket.id,
    //   hasAuth: !!socket.handshake.auth,
    //   authKeys: socket.handshake.auth ? Object.keys(socket.handshake.auth) : [],
    //   hasQuery: !!socket.handshake.query,
    //   queryKeys: socket.handshake.query ? Object.keys(socket.handshake.query) : [],
    //   // Не логируем сам токен из соображений безопасности!
    //   userAgent: socket.handshake.headers['user-agent']?.substring(0, 50)
    // })
    
    // ============================================
    // ИЗВЛЕЧЕНИЕ ТОКЕНА ИЗ РАЗНЫХ ИСТОЧНИКОВ
    // ============================================
    let token: string | undefined

    // 1. Проверяем socket.handshake.auth.token (основной способ)
    // ✅ ИСПРАВЛЕНО: проверяем тип и длину, а не только наличие ключа
    if (typeof socket.handshake.auth?.token === 'string' && socket.handshake.auth.token.trim().length > 0) {
      token = socket.handshake.auth.token.trim()
      console.log('[SocketAuth] 📦 Токен найден в auth.token (длина:', token.length, ')')
    }
    // 2. Проверяем socket.handshake.auth.auth_token (альтернативное имя)
    else if (typeof socket.handshake.auth?.auth_token === 'string' && socket.handshake.auth.auth_token.trim().length > 0) {
      token = socket.handshake.auth.auth_token.trim()
      console.log('[SocketAuth] 📦 Токен найден в auth.auth_token (длина:', token.length, ')')
    }
    // 3. Проверяем query параметры (для обратной совместимости)
    else if (typeof socket.handshake.query?.token === 'string' && socket.handshake.query.token.trim().length > 0) {
      token = socket.handshake.query.token.trim()
      console.log('[SocketAuth] 📦 Токен найден в query.token (длина:', token.length, ')')
    }
    // 4. Проверяем заголовок Authorization (Bearer token)
    else if (socket.handshake.headers?.authorization) {
      const authHeader = socket.handshake.headers.authorization as string
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim()
        if (token.length > 0) {
          console.log('[SocketAuth] 📦 Токен найден в Authorization header (длина:', token.length, ')')
        }
      }
    }

    // ============================================
    // ПРОВЕРКА НАЛИЧИЯ ТОКЕНА
    // ============================================
    // ✅ ИСПРАВЛЕНО: явная проверка на строку и минимальную длину
    if (!token || typeof token !== 'string' || token.length < 10) {
      console.error('[SocketAuth] ❌ Токен не предоставлен или невалиден. auth:', 
        socket.handshake.auth ? Object.keys(socket.handshake.auth) : 'none',
        'token value length:', token?.length
      )
      return next(new Error('No token provided'))
    }
    
    // ============================================
    // АУТЕНТИФИКАЦИЯ ПОЛЬЗОВАТЕЛЯ
    // ============================================
    
    const user = await authenticateUser(token)
    
    // ✅ Сохраняем пользователя в сокете для последующего использования
    ;(socket as any).user = user
    
    // ✅ Сохраняем userId в data сокета для удобства
    socket.data.userId = user.id
    
    console.log(`[SocketAuth] ✅ Аутентификация успешна: user ${user.id} (${user.email})`)
    
    // ✅ Продолжаем обработку подключения
    next()
    
  } catch (error) {
    console.error('[SocketAuth] ❌ Ошибка middleware:', error instanceof Error ? error.message : error)
    
    // ✅ Прерываем подключение
    next(error instanceof Error ? error : new Error('Authentication failed'))
  }
}
