// server/socket/middleware/auth.ts
import { verifyToken } from '../../utils/jwt'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import type { Socket } from 'socket.io'
import { createError } from 'h3'

/**
 * Проверка токена и аутентификация пользователя
 * @param token Токен, полученный от клиента
 * @returns Пользователь, если аутентификация успешна
 */
export async function authenticateUser(token: string) {
  try {
    // Проверяем токен
    const payload = await verifyToken(token)
    
    // Проверяем, существует ли пользователь
    const [user] = await db.select().from(users).where(eq(users.id, payload.id))
    
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'User not found' })
    }
    
    return {
      id: user.id,
      email: user.login,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: true
    }
  } catch (error) {
    throw createError({
      statusCode: 401,
      statusMessage: error instanceof Error ? error.message : 'Unauthorized'
    })
  }
}

/**
 * Middleware для проверки аутентификации сокета
 * @param socket Сокет-соединение
 * @param next Функция для продолжения обработки
 */
export async function socketAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    // More robust token extraction
    let token = socket.handshake.auth.token || socket.handshake.auth.auth_token;
    
    // Also check query parameters for token (for initial connection)
    if (!token && socket.handshake.query && socket.handshake.query.token) {
      token = socket.handshake.query.token as string;
    }
    
    if (!token) {
      throw new Error('No token provided');
    }
    
    // Verify token
    const user = await authenticateUser(token);
    (socket as any).user = user;
    next();
  } catch (error) {
    console.error('Socket authentication failed:', error);
    next(error instanceof Error ? error : new Error('Authentication failed'));
  }
}
