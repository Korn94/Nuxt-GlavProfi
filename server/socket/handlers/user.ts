// server/socket/handlers/user.ts
import { Socket } from 'socket.io'
import { db } from '../../db'
import { users, userSessions } from '../../db/schema'
import { eq, or, desc } from 'drizzle-orm'
import type { Server } from 'socket.io'
import { createSession, updateSessionStatus } from '../../utils/sessions'

/**
 * Обработчик событий, связанных с пользователем
 */
export function setupUserHandlers(socket: Socket, user: any, io: Server) {
  console.log(`👤 Пользователь подключился: ${user.id} (${user.name || user.login})`)
  console.log(`   ID сокета: ${socket.id}`)

  // Получаем IP-адрес пользователя (с защитой от ошибок)
  const ipAddress = (() => {
    // Пытаемся получить из x-forwarded-for (для прокси/облака)
    // Или из коннекта
    // @ts-ignore - socket.conn может быть недоступен в типах
    const remoteAddr = socket.conn?.remoteAddress || socket.handshake.address
    if (typeof remoteAddr === 'string') {
      return remoteAddr.replace(/^::ffff:/, '')
    }
    return 'unknown'
  })()

  console.log(`   IP: ${ipAddress}`)

  // ============================================
  // ВОССТАНОВЛЕНИЕ ИЛИ СОЗДАНИЕ СЕССИИ
  // ============================================
  ;(async () => {
    try {
      const userAgent = socket.handshake.headers['user-agent'] || 'Unknown'
      
      // Получаем sessionId из кук (переданных при подключении)
      let sessionIdCookie: string | undefined = undefined
      
      if (socket.handshake.headers.cookie) {
        const sessionCookie = socket.handshake.headers.cookie
          .split(';')
          .map(c => c.trim())
          .find(c => c.startsWith('session_id='))
        
        if (sessionCookie) {
          const parts = sessionCookie.split('=')
          sessionIdCookie = parts.length > 1 ? parts[1] : undefined
        }
      }

      console.log(`   ID сессии из кук: ${sessionIdCookie || 'нет'}`)

      let session = null

      // Если есть существующая сессия - пытаемся её восстановить
      if (sessionIdCookie) {
        // Проверяем, существует ли сессия в БД
        const [existingSession] = await db
          .select()
          .from(userSessions)
          .where(eq(userSessions.sessionId, sessionIdCookie))

        if (existingSession) {
          console.log(`   ✅ Найдена существующая сессия: ${sessionIdCookie}`)
          
          // Обновляем существующую сессию
          session = await updateSessionStatus(sessionIdCookie, 'online', ipAddress)
          
          console.log(`   ✅ Сессия ${sessionIdCookie} восстановлена и обновлена`)
        } else {
          console.log(`   ⚠️ Сессия ${sessionIdCookie} не найдена в базе данных, создаю новую...`)
        }
      }

      // Если сессии нет или она не найдена - создаем новую
      if (!session) {
        console.log(`   Создаю новую сессию для пользователя ${user.id}...`)
        session = await createSession(user.id, ipAddress, userAgent)
        
        if (!session) {
          throw new Error('Не удалось создать сессию')
        }
        
        console.log(`   ✅ Новая сессия создана: ${session.sessionId}`)
      }

      // Сохраняем sessionId в сокете для последующих операций
      ;(socket as any).sessionId = session.sessionId

      // ============================================
      // ✅ ПОЛУЧАЕМ ПОЛНЫЕ ДАННЫЕ ОНЛАЙН-ПОЛЬЗОВАТЕЛЕЙ С ИНФОРМАЦИЕЙ О ПОЛЬЗОВАТЕЛЯХ
      // ============================================
      const onlineUsers = await getOnlineUsersWithUserData()

      // Отправляем обновленный список ВСЕМ подключенным клиентам
      io.emit('online-users:update', onlineUsers)

      // Отправляем подтверждение клиенту
      socket.emit('session:initialized', {
        sessionId: session.sessionId,
        userId: user.id,
        status: 'online',
        restored: !!sessionIdCookie // Флаг, что сессия восстановлена
      })

      console.log(`   📡 Список онлайн-пользователей отправлен (${onlineUsers.length} пользователей)`)
    } catch (error) {
      console.error('❌ Ошибка инициализации сессии:', error)
    }
  })()

  // ============================================
  // ОБНОВЛЕНИЕ ДАННЫХ СЕССИИ (опционально)
  // ============================================
  socket.on('session:update', async (data) => {
    try {
      const { ipAddress: newIp, userAgent } = data
      const sessionId = (socket as any).sessionId

      if (!sessionId) {
        console.warn('Получено обновление сессии без активной сессии')
        return
      }

      console.log(`   Обновляю сессию ${sessionId}...`)

      // Обновляем данные сессии через статус (это обновит последнюю активность)
      await updateSessionStatus(sessionId, 'online', newIp || ipAddress)

      console.log(`   ✅ Сессия ${sessionId} обновлена`)

      // ============================================
      // ✅ ОТПРАВЛЯЕМ ПОЛНЫЕ ДАННЫЕ ПРИ ОБНОВЛЕНИИ СЕССИИ
      // ============================================
      const onlineUsers = await getOnlineUsersWithUserData()
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('Ошибка обновления сессии:', error)
    }
  })

  // ============================================
  // ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
  // ============================================
  socket.on('user:update', async (updatedData) => {
    try {
      console.log(`   Обновляю данные пользователя ${user.id}...`)

      // Валидация входных данных
      if (!updatedData || typeof updatedData !== 'object') {
        throw new Error('Неверные данные для обновления')
      }

      // Обновляем только разрешенные поля
      const updateFields: any = {}
      
      if (updatedData.name && typeof updatedData.name === 'string') {
        updateFields.name = updatedData.name.trim()
      }

      if (Object.keys(updateFields).length === 0) {
        console.warn('Нет валидных полей для обновления')
        return
      }

      // Обновляем данные пользователя в БД
      await db.update(users).set(updateFields).where(eq(users.id, user.id))

      // Получаем обновленные данные пользователя
      const [updatedUser] = await db
        .select({
          id: users.id,
          name: users.name,
          login: users.login,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .where(eq(users.id, user.id))

      if (!updatedUser) {
        throw new Error('Пользователь не найден после обновления')
      }

      // Отправляем обновленные данные всем подключенным клиентам
      io.emit('user:update', {
        id: updatedUser.id,
        email: updatedUser.login,
        name: updatedUser.name,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
        isVerified: true
      })

      console.log(`   ✅ Пользователь ${user.id} обновлен:`, updateFields)

      // ============================================
      // ✅ ОБНОВЛЯЕМ СПИСОК ОНЛАЙН-ПОЛЬЗОВАТЕЛЕЙ ПОСЛЕ ИЗМЕНЕНИЯ ДАННЫХ
      // ============================================
      const onlineUsers = await getOnlineUsersWithUserData()
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('❌ Ошибка обновления пользователя:', error)
      socket.emit('error', {
        message: 'Не удалось обновить данные пользователя',
        code: 'USER_UPDATE_ERROR'
      })
    }
  })

  // ============================================
  // HEARTBEAT / PING-PONG
  // ============================================
  socket.on('heartbeat', () => {
    // Просто подтверждаем получение heartbeat
    socket.emit('heartbeat:ack')
  })

  socket.on('ping', () => {
    socket.emit('pong')
  })

  // ============================================
  // ОБРАБОТКА ОТКЛЮЧЕНИЯ
  // ============================================
  socket.on('disconnect', async (reason) => {
    console.log(`👋 Пользователь отключился: ${user.id} (${user.name || user.login})`)
    console.log(`   Причина: ${reason}`)
    console.log(`   ID сокета: ${socket.id}`)

    try {
      // Получаем sessionId из сокета
      const sessionId = (socket as any).sessionId

      if (sessionId) {
        console.log(`   Помечаю сессию ${sessionId} как оффлайн...`)

        // Обновляем статус на оффлайн
        await updateSessionStatus(sessionId, 'offline')

        console.log(`   ✅ Сессия ${sessionId} помечена как оффлайн`)

        // ============================================
        // ✅ ОТПРАВЛЯЕМ ОБНОВЛЕННЫЙ СПИСОК ПОСЛЕ ОТКЛЮЧЕНИЯ
        // ============================================
        const onlineUsers = await getOnlineUsersWithUserData()
        io.emit('online-users:update', onlineUsers)

        console.log(`   📡 Список онлайн-пользователей отправлен (${onlineUsers.length} пользователей)`)
      } else {
        console.warn('   ID сессии не найден для отключившегося пользователя')
      }
    } catch (error) {
      console.error('❌ Ошибка обработки отключения:', error)
    }
  })

  // ============================================
  // ОБРАБОТКА ОШИБОК СОКЕТА
  // ============================================
  socket.on('error', (error) => {
    console.error(`❌ Socket error for user ${user.id}:`, error);
    
    // Try to recover from common errors
    if (error.message.includes('timeout')) {
      console.log('Handling timeout error, attempting to reconnect...');
      socket.disconnect();
    }
  });

  // Add this to handle connection errors better
  socket.on('connect_error', (error) => {
    console.error('Connect error:', error);
    // Handle specific errors
    if (error.message === 'Unauthorized') {
      console.log('Authentication failed, disconnecting');
      socket.disconnect();
    }
  });
}

// ============================================
// ✅ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: ПОЛУЧЕНИЕ ОНЛАЙН-ПОЛЬЗОВАТЕЛЕЙ С ДАННЫМИ ПОЛЬЗОВАТЕЛЕЙ
// ============================================
async function getOnlineUsersWithUserData() {
  // Получаем активные сессии
  const sessions = await db
    .select({
      id: userSessions.id,
      userId: userSessions.userId,
      sessionId: userSessions.sessionId,
      status: userSessions.status,
      lastActivity: userSessions.lastActivity,
      startedAt: userSessions.startedAt,
      ipAddress: userSessions.ipAddress
    })
    .from(userSessions)
    .where(
      or(
        eq(userSessions.status, 'online'),
        eq(userSessions.status, 'afk')
      )
    )
    .orderBy(desc(userSessions.lastActivity))

  // Для каждой сессии получаем данные пользователя
  const sessionsWithUsers = await Promise.all(
    sessions.map(async (session) => {
      const [userData] = await db
        .select({
          name: users.name,
          role: users.role,
          login: users.login
        })
        .from(users)
        .where(eq(users.id, session.userId))

      return {
        ...session,
        user: userData || undefined // Возвращаем undefined вместо пустого объекта
      }
    })
  )

  return sessionsWithUsers
}
