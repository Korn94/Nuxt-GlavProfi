// server/socket/handlers/user.ts
import { Socket } from 'socket.io'
import { db } from '../../db'
import { users, userSessions } from '../../db/schema'
import { eq, and, or, desc, ne } from 'drizzle-orm'
import type { Server } from 'socket.io'
import { createSession, updateSessionStatus, getOnlineUsers, closeZombieSessions } from '../../utils/sessions'
import { broadcastStatus } from './status'

/**
 * Обработчик событий, связанных с пользователем
 */
export function setupUserHandlers(socket: Socket, user: any, io: Server) {
  console.log(`👤 Пользователь подключился: ${user.id} (${user.name || user.email})`)
  console.log(`   ID сокета: ${socket.id}`)

  const userName = user.name || user.email || 'Unknown'

  // Получаем IP-адрес пользователя (с защитой от ошибок)
  const ipAddress = (() => {
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
      let isRestored = false

      // Проверяем, была ли сессия активна недавно (в последние 5 минут)
      if (activeSession) {
        const lastActivityTime = activeSession.lastActivity
          ? new Date(activeSession.lastActivity).getTime()
          : 0
        const now = Date.now()
        const timeDiff = now - lastActivityTime
        const FIVE_MINUTES = 5 * 60 * 1000

        // Если сессия была активна недавно - восстанавливаем её
        if (timeDiff < FIVE_MINUTES) {
          console.log(`   ✅ Восстанавливаем сессию: ${activeSession.sessionId}`)
          
          session = await updateSessionStatus(activeSession.sessionId, 'online', {
            ipAddress,
            isActiveTab: true,
            currentPath: activeSession.currentPath || '/'
          })
          
          isRestored = true
        } else {
          console.log(`   ⏰ Сессия устарела (${Math.round(timeDiff / 1000)}с), создаём новую`)
        }
      }

      // ============================================
      // ✅ СОЗДАНИЕ НОВОЙ СЕССИИ
      // ============================================
      if (!session) {
        console.log(`   🆕 Создаём новую сессию...`)
        
        // ✅ КРИТИЧНО: Закрываем старые сессии перед созданием новой
        // Это предотвращает накопление «зомби»-сессий
        await closeZombieSessions(user.id)
        
        session = await createSession(user.id, ipAddress, userAgent)
        
        if (!session) {
          throw new Error('Не удалось создать сессию')
        }
        
        console.log(`   ✅ Новая сессия создана: ${session.sessionId}`)
      }

      // Сохраняем sessionId в сокете для последующих операций
      ;(socket as any).sessionId = session.sessionId

      // ============================================
      // ✅ ОТПРАВЛЯЕМ СПИСОК ОНЛАЙН-ПОЛЬЗОВАТЕЛЕЙ
      // ============================================
      const onlineUsers = await getOnlineUsers()
      const usersList = onlineUsers || []

      io.emit('online-users:update', usersList)

      // ✅ ОТПРАВЛЯЕМ УВЕДОМЛЕНИЕ О ВХОДЕ
      broadcastStatus(io, socket, user.id, userName, 'online', {
        sessionId: session.sessionId
      })

      // Отправляем подтверждение клиенту
      socket.emit('session:initialized', {
        sessionId: session.sessionId,
        userId: user.id,
        status: 'online',
        restored: isRestored
      })

      console.log(`   📡 Список отправлен (${usersList.length} пользователей)`)

    } catch (error) {
      console.error('❌ Ошибка инициализации сессии:', error)
    }
  })()

  // ============================================
  // РЕГИСТРАЦИЯ ВКЛАДКИ
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

      // Обновляем список онлайн-пользователей
      const onlineUsers = await getOnlineUsers()
      const usersList = onlineUsers || []
      io.emit('online-users:update', usersList)

    } catch (error) {
      console.error('Ошибка регистрации вкладки:', error)
    }
  })

  // ============================================
  // НАВИГАЦИЯ ПО СТРАНИЦАМ
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

      await updateSessionStatus(sessionId, 'online', {
        currentPath
      })

      const onlineUsers = await getOnlineUsers()
      const usersList = onlineUsers || []
      io.emit('online-users:update', usersList)

    } catch (error) {
      console.error('Ошибка обработки навигации:', error)
    }
  })

  // ============================================
  // ОБРАБОТКА ОТКЛЮЧЕНИЯ
  // ============================================
  socket.on('disconnect', async (reason: string) => {
    console.log(`👋 Пользователь отключился: ${user.id} (${user.name || user.email})`)
    console.log(`   Причина: ${reason}`)

    try {
      const sessionId = (socket as any).sessionId

      if (sessionId) {
        console.log(`   Помечаю сессию ${sessionId} как оффлайн...`)

        // ✅ КРИТИЧНО: updateSessionStatus теперь сам ставит endedAt при статусе 'offline'
        await updateSessionStatus(sessionId, 'offline')

        console.log(`   ✅ Сессия ${sessionId} помечена как оффлайн (endedAt установлен)`)

        // Обновляем список онлайн-пользователей
        const onlineUsers = await getOnlineUsers()
        const usersList = onlineUsers || []
        io.emit('online-users:update', usersList)

        // Отправляем уведомление о выходе
        broadcastStatus(io, socket, user.id, userName, 'offline', {
          sessionId
        })

        console.log(`   📡 Список отправлен (${usersList.length} пользователей)`)
      } else {
        console.warn('   ID сессии не найден для отключившегося пользователя')
      }

    } catch (error) {
      console.error('❌ Ошибка обработки отключения:', error)
    }
  })

  // ============================================
  // HEARTBEAT
  // ============================================
  socket.on('heartbeat', () => {
    socket.emit('heartbeat:ack')
  })

  // ============================================
  // ОШИБКИ
  // ============================================
  socket.on('error', (error: any) => {
    console.error(`❌ Socket error for user ${user.id}:`, error)
  })
}
