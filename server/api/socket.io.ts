// server/api/socket.io.ts
import { createServer } from 'http'
import { defineEventHandler, sendError, createError, H3Event } from 'h3'
import { Server, Socket } from 'socket.io'
import { verifyToken } from '../utils/jwt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { User } from '~/types'

// Глобальное хранилище активных подключений
const activeSockets = new Map<number, Socket>()

/**
 * Проверка токена и аутентификация пользователя
 * @param token Токен, полученный от клиента
 * @returns Пользователь, если аутентификация успешна
 */
const authenticateUser = async (token: string) => {
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
      // avatar: user.avatar
    }
  } catch (error) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: error instanceof Error ? error.message : 'Unauthorized' 
    })
  }
}

/**
 * Обработчик событий сокета
 * @param socket Сокет-соединение
 * @param user Аутентифицированный пользователь
 */
const setupSocketHandlers = (socket: Socket, user: User) => {
  console.log(`User connected: ${user.id} (${user.name})`)
  
  // Сохраняем сокет в глобальном хранилище
  activeSockets.set(user.id, socket)
  
  // Обработка событий
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${user.id} (${user.name})`)
    activeSockets.delete(user.id)
  })
  
  // Пример обработки события
  socket.on('message', (data) => {
    console.log(`Received message from ${user.id}:`, data)
    // Здесь можно добавить логику обработки сообщений
  })
  
  // Обработка события обновления пользователя
  socket.on('user:update', async (updatedData) => {
    try {
      // Обновляем данные пользователя в БД
      const [updatedUser] = await db
        .update(users)
        .set({
          name: updatedData.name || user.name,
          // avatar: updatedData.avatar || user.avatar
        })
        .where(eq(users.id, user.id))
        .returning()
      
      // Отправляем обновленные данные всем подключенным клиентам
      io.emit('user:update', updatedUser)
    } catch (error) {
      console.error('Error updating user:', error)
    }
  })
  
  // Другие обработчики событий можно добавить здесь
}

// Создаем HTTP-сервер
const httpServer = createServer()

// Инициализируем Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket'],
  allowEIO3: true
})

// Обработчик подключения
io.on('connection', async (socket) => {
  try {
    // Получаем токен из параметров подключения
    const token = socket.handshake.auth.auth_token
    
    if (!token) {
      throw new Error('No token provided')
    }
    
    // Аутентифицируем пользователя
    const user = await authenticateUser(token)
    
    // Устанавливаем обработчики событий
    setupSocketHandlers(socket, user)
    
  } catch (error) {
    console.error('Connection error:', error)
    socket.disconnect(true)
  }
})

// Обработчик для интеграции с Nuxt 4
export default defineEventHandler(async (event: H3Event) => {
  // Проверяем, является ли это запрос для Socket.IO
  if (event.req.url === '/api/socket.io') {
    // Перенаправляем запрос на обработку Socket.IO
    io.handle(event.req, event.res)
    
    // Возвращаем Promise, чтобы Nuxt ждал завершения обработки
    return new Promise((resolve) => {
      event.res.on('finish', resolve)
    })
  }
  
  // Если это не запрос для Socket.IO, возвращаем ошибку
  return sendError(
    createError({
      statusCode: 404,
      statusMessage: 'Not Found'
    })
  )
})
