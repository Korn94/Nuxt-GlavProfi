// server/socket/handlers/user.ts
import { Socket } from 'socket.io'
import { db } from '../../db'
import { users, userSessions } from '../../db/schema'
import { eq, and, or, desc, sql } from 'drizzle-orm'
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
  // ВОССТАНОВЛЕНИЕ ИЛИ СОЗДАНИЕ СЕССИИ ПО ПОЛЬЗОВАТЕЛЮ
  // ============================================
  ;(async () => {
    try {
      const userAgent = socket.handshake.headers['user-agent'] || 'Unknown'

      console.log(`   Ищу последнюю сессию пользователя ${user.id}...`)

      let session = null

      // ============================================
      // ✅ ИЩЕМ ПОСЛЕДНЮЮ СЕССИЮ ПОЛЬЗОВАТЕЛЯ (независимо от статуса)
      // ============================================
      const [existingSession] = await db
        .select()
        .from(userSessions)
        .where(eq(userSessions.userId, user.id))
        .orderBy(desc(userSessions.lastActivity))
        .limit(1)

      // Проверяем, была ли сессия активна недавно (в последние 5 минут)
      if (existingSession) {
        const lastActivityTime = new Date(existingSession.lastActivity).getTime()
        const now = Date.now()
        const timeDiff = now - lastActivityTime
        const FIVE_MINUTES = 5 * 60 * 1000

        // Если сессия была активна недавно - восстанавливаем её
        if (timeDiff < FIVE_MINUTES) {
          console.log(`   ✅ Нашли недавнюю сессию: ${existingSession.sessionId}`)
          console.log(`   Статус: ${existingSession.status}`)
          console.log(`   Последняя активность: ${existingSession.lastActivity}`)
          console.log(`   Время простоя: ${Math.round(timeDiff / 1000)}с`)

          // Обновляем статус на "онлайн" и обновляем время активности
          session = await updateSessionStatus(existingSession.sessionId, 'online', ipAddress)

          console.log(`   ✅ Сессия ${existingSession.sessionId} восстановлена и обновлена`)
        } else {
          console.log(`   ⏰ Старая сессия найдена, но слишком долго неактивна (${Math.round(timeDiff / 1000)}с)`)
          console.log(`   🆕 Создаю новую сессию...`)
          
          session = await createSession(user.id, ipAddress, userAgent)
          
          if (!session) {
            throw new Error('Не удалось создать сессию')
          }
          
          console.log(`   ✅ Новая сессия создана: ${session.sessionId}`)
        }
      } else {
        // Если сессий вообще нет - создаем новую
        console.log(`   🆕 Сессий не найдено, создаю новую...`)
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
      const onlineUsers = await getOnlineUsers()

      // Отправляем обновленный список ВСЕМ подключенным клиентам
      io.emit('online-users:update', onlineUsers)

      // Отправляем подтверждение клиенту
      socket.emit('session:initialized', {
        sessionId: session.sessionId,
        userId: user.id,
        status: 'online',
        restored: !!existingSession // Флаг, что сессия восстановлена
      })

      console.log(`   📡 Список онлайн-пользователей отправлен (${onlineUsers.length} пользователей)`)
    } catch (error) {
      console.error('❌ Ошибка инициализации сессии:', error)
    }
  })()

  // ============================================
  // ОБНОВЛЕНИЕ ДАННЫХ СЕССИИ (опционально)
  // ============================================
  socket.on('session:update', async (data: any) => {
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
      const onlineUsers = await getOnlineUsers()
      io.emit('online-users:update', onlineUsers)
    } catch (error) {
      console.error('Ошибка обновления сессии:', error)
    }
  })

  // ============================================
  // ОБНОВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ
  // ============================================
  socket.on('user:update', async (updatedData: any) => {
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
      const onlineUsers = await getOnlineUsers()
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
  socket.on('disconnect', async (reason: string) => {
    console.log(`👋 Пользователь отключился: ${user.id} (${user.name || user.login})`)
    console.log(`   Причина: ${reason}`)
    console.log(`   ID сокета: ${socket.id}`)

    try {
      // Получаем sessionId из сокета
      const sessionId = (socket as any).sessionId

      if (sessionId) {
        console.log(`   Помечаю сессию ${sessionId} как оффлайн...`)

        // ✅ НЕ ЗАВЕРШАЕМ СЕССИЮ СРАЗУ - просто помечаем как offline
        // Это позволит восстановить её при быстром переподключении
        await updateSessionStatus(sessionId, 'offline')

        console.log(`   ✅ Сессия ${sessionId} помечена как оффлайн`)

        // ============================================
        // ✅ ОТПРАВЛЯЕМ ОБНОВЛЕННЫЙ СПИСОК ПОСЛЕ ОТКЛЮЧЕНИЯ
        // ============================================
        const onlineUsers = await getOnlineUsers()
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
  socket.on('error', (error: any) => {
    console.error(`❌ Socket error for user ${user.id}:`, error)
    // Try to recover from common errors
    if (error.message.includes('timeout')) {
      console.log('Handling timeout error, attempting to reconnect...')
      socket.disconnect()
    }
  })

  // Add this to handle connection errors better
  socket.on('connect_error', (error: any) => {
    console.error('Connect error:', error)
    // Handle specific errors
    if (error.message === 'Unauthorized') {
      console.log('Authentication failed, disconnecting')
      socket.disconnect()
    }
  })
}

// ============================================
// ✅ ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: ПОЛУЧЕНИЕ ОНЛАЙН-ПОЛЬЗОВАТЕЛЕЙ С ДАННЫМИ ПОЛЬЗОВАТЕЛЕЙ
// ============================================
async function getOnlineUsers() {
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
        user: userData || undefined
      }
    })
  )

  // ✅ ФИЛЬТРУЕМ СЕССИИ БЕЗ ПОЛЬЗОВАТЕЛЯ
  const validSessions = sessionsWithUsers.filter(
    (session) => session.user !== undefined && session.user !== null
  )

  // console.log(`📊 Онлайн пользователей: ${validSessions.length} (отфильтровано ${sessionsWithUsers.length - validSessions.length} без данных)`)

  return validSessions
}
