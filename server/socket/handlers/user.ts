// server/socket/handlers/user.ts
import { Socket } from 'socket.io'
import { db } from '../../db'
import { users, userSessions } from '../../db/schema'
import { eq, and, or, desc, ne } from 'drizzle-orm'
import type { Server } from 'socket.io'
import { createSession, updateSessionStatus, getOnlineUsers } from '../../utils/sessions'
import { broadcastStatus } from './status'

/**
 * Обработчик событий, связанных с пользователем
 */
export function setupUserHandlers(socket: Socket, user: any, io: Server) {
  console.log(`👤 Пользователь подключился: ${user.id} (${user.name || user.email})`)
  console.log(`   ID сокета: ${socket.id}`)
  
  // ✅ ИСПРАВЛЕНО: Определяем переменные в начале
  const userName = user.name || user.email || 'Unknown'
  
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

      // ============================================
      // ✅ ИЩЕМ АКТИВНУЮ ВКЛАДКУ ПОЛЬЗОВАТЕЛЯ
      // ============================================
      const [activeSession] = await db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.userId, user.id),
            or(
              eq(userSessions.status, 'online'),
              eq(userSessions.status, 'afk')
            )
          )
        )
        .orderBy(desc(userSessions.lastActivity))
        .limit(1)

      let session = null

      // Проверяем, была ли сессия активна недавно (в последние 5 минут)
      if (activeSession) {
        // ✅ ИСПРАВЛЕНО: Проверяем, что дата не null
        const lastActivityTime = activeSession.lastActivity
          ? new Date(activeSession.lastActivity).getTime()
          : 0
        const now = Date.now()
        const timeDiff = now - lastActivityTime
        const FIVE_MINUTES = 5 * 60 * 1000

        // Если сессия была активна недавно - восстанавливаем её
        if (timeDiff < FIVE_MINUTES) {
          console.log(`   ✅ Нашли недавнюю сессию: ${activeSession.sessionId}`)
          console.log(`   Статус: ${activeSession.status}`)
          console.log(`   Последняя активность: ${activeSession.lastActivity}`)
          console.log(`   Время простоя: ${Math.round(timeDiff / 1000)}с`)

          // Обновляем статус на "онлайн" и обновляем время активности
          session = await updateSessionStatus(activeSession.sessionId, 'online', {
            ipAddress,
            isActiveTab: true, // ✅ Помечаем как активную вкладку
            currentPath: activeSession.currentPath || '/'
          })

          console.log(`   ✅ Сессия ${activeSession.sessionId} восстановлена и обновлена`)
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

      // ✅ ИСПРАВЛЕНО: Проверяем, что сессия существует
      if (!session) {
        console.error('❌ Не удалось создать или восстановить сессию')
        return
      }

      // Сохраняем sessionId в сокете для последующих операций
      ;(socket as any).sessionId = session.sessionId

      // ============================================
      // ✅ ПОЛУЧАЕМ ПОЛНЫЕ ДАННЫЕ ОНЛАЙН-ПОЛЬЗОВАТЕЛЕЙ С ИНФОРМАЦИЕЙ О ПОЛЬЗОВАТЕЛЯХ
      // ============================================
      const onlineUsers = await getOnlineUsers()

      // ✅ ИСПРАВЛЕНО: Проверяем, что онлайн-пользователи не undefined
      const usersList = onlineUsers || []

      // Отправляем обновленный список ВСЕМ подключенным клиентам
      io.emit('online-users:update', usersList)

      // ✅ ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ О ВХОДЕ В СЕТЬ
      broadcastStatus(io, socket, user.id, userName, 'online', {
        sessionId: session.sessionId
      })

      // Отправляем подтверждение клиенту
      socket.emit('session:initialized', {
        sessionId: session.sessionId,
        userId: user.id,
        status: 'online',
        restored: !!activeSession // Флаг, что сессия восстановлена
      })

      console.log(`   📡 Список онлайн-пользователей отправлен (${usersList.length} пользователей)`)
    } catch (error) {
      console.error('❌ Ошибка инициализации сессии:', error)
    }
  })()

  // ============================================
  // РЕГИСТРАЦИЯ ВКЛАДКИ (НОВОЕ СОБЫТИЕ)
  // ============================================
  socket.on('tab:register', async (data: { tabId: string; currentPath?: string }) => {
    try {
      const { tabId, currentPath } = data
      const sessionId = (socket as any).sessionId

      if (!sessionId || !tabId) {
        console.warn('Получена регистрация вкладки без sessionId или tabId')
        return
      }

      console.log(`   📌 Регистрация вкладки: ${tabId}`)

      // Помечаем все сессии пользователя КРОМЕ текущей как неактивные
      await db
        .update(userSessions)
        .set({ isActiveTab: false })
        .where(
          and(
            eq(userSessions.userId, user.id),
            ne(userSessions.sessionId, sessionId)
          )
        )

      // Обновляем текущую сессию
      await updateSessionStatus(sessionId, 'online', {
        tabId,
        currentPath,
        isActiveTab: true
      })

      console.log(`   ✅ Вкладка ${tabId} зарегистрирована как активная`)

      // Обновляем список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      const usersList = onlineUsers || []
      io.emit('online-users:update', usersList)
    } catch (error) {
      console.error('Ошибка регистрации вкладки:', error)
    }
  })

  // ============================================
  // НАВИГАЦИЯ ПО СТРАНИЦАМ (НОВОЕ СОБЫТИЕ)
  // ============================================
  socket.on('tab:navigate', async (data: { currentPath: string }) => {
    try {
      const { currentPath } = data
      const sessionId = (socket as any).sessionId

      if (!sessionId || !currentPath) {
        console.warn('Получено событие навигации без sessionId или currentPath')
        return
      }

      console.log(`   🧭 Навигация: ${currentPath}`)

      // Обновляем текущий путь сессии
      await updateSessionStatus(sessionId, 'online', {
        currentPath
      })

      // Обновляем список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      const usersList = onlineUsers || []
      io.emit('online-users:update', usersList)
    } catch (error) {
      console.error('Ошибка обработки навигации:', error)
    }
  })

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
      await updateSessionStatus(sessionId, 'online', {
        ipAddress: newIp || ipAddress
      })

      console.log(`   ✅ Сессия ${sessionId} обновлена`)

      // ============================================
      // ✅ ОТПРАВЛЯЕМ ПОЛНЫЕ ДАННЫЕ ПРИ ОБНОВЛЕНИИ СЕССИИ
      // ============================================
      const onlineUsers = await getOnlineUsers()
      const usersList = onlineUsers || []
      io.emit('online-users:update', usersList)
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
      const usersList = onlineUsers || []
      io.emit('online-users:update', usersList)
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
    console.log(`👋 Пользователь отключился: ${user.id} (${user.name || user.email})`)
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
        const usersList = onlineUsers || []
        io.emit('online-users:update', usersList)

        // ✅ ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ О ВЫХОДЕ
        broadcastStatus(io, socket, user.id, userName, 'offline', {
          sessionId
        })

        console.log(`   📡 Список онлайн-пользователей отправлен (${usersList.length} пользователей)`)
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
