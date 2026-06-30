// server/socket/handlers/user.ts
/**
 * Обработчик событий, связанных с пользователем и сессиями
 *
 * Функциональность:
 * - Управление сессиями (создание/восстановление/закрытие)
 * - Регистрация вкладок (multi-tab support)
 * - Навигация по страницам
 * - Heartbeat (поддержание соединения)
 * - 🆕 Уведомления об изменении прав (permissions:changed)
 * - 🆕 Принудительное отключение (force:disconnect)
 *
 * Интеграция с ACL:
 * - Использует invalidatePermissionsCache() при изменении прав
 * - Отправляет уведомления через socket для синхронизации в реальном времени
 */

import { Socket } from 'socket.io'
import { db } from '../../db'
import { users, userSessions } from '../../db/schema'
import { eq, and, or, desc, ne, isNull } from 'drizzle-orm'
import type { Server } from 'socket.io'
import { createSession, updateSessionStatus, getOnlineUsers, closeZombieSessions } from '../../utils/sessions'
import { broadcastStatus } from './status'
import { invalidatePermissionsCache } from '../../utils/permissions'
import { invalidateOnlineCache } from '../../api/online.get'

// ============================================
// 🆕 УВЕДОМЛЕНИЯ ОБ ИЗМЕНЕНИИ ПРАВ
// ============================================

/**
 * Отправить пользователю уведомление об изменении его прав.
 *
 * Используется когда:
 * - Админ изменил права роли пользователя
 * - Админ добавил/удалил override для пользователя
 * - Override истёк (по expiresAt)
 *
 * Клиент (socketStore) ловит это событие и:
 * 1. Показывает уведомление
 * 2. Перезагружает права через /api/permissions
 * 3. Обновляет UI
 *
 * @example
 * // После изменения прав через API:
 * await notifyUserPermissionsChanged(io, userId, {
 *   reason: 'Админ изменил права роли manager',
 *   changedPages: ['objects', 'works']
 * })
 */
export async function notifyUserPermissionsChanged(
  io: Server,
  userId: number,
  details: {
    reason: string
    changedPages?: string[]
    requireRelogin?: boolean
  }
): Promise<void> {
  // Ищем активный сокет пользователя
  const sockets = await io.fetchSockets()
  const userSocket = sockets.find(s => s.data.userId === userId)

  if (!userSocket) {
    console.log(`[UserHandler] ⚠️ User ${userId} не подключён, уведомление не отправлено`)
    return
  }

  // Инвалидируем кэш прав на сервере
  invalidatePermissionsCache(userId)

  // Отправляем уведомление
  userSocket.emit('permissions:changed', {
    reason: details.reason,
    changedPages: details.changedPages || [],
    requireRelogin: details.requireRelogin || false,
    timestamp: new Date().toISOString()
  })

  console.log(`[UserHandler] 📣 Отправлено уведомление об изменении прав user=${userId}: ${details.reason}`)
}

/**
 * Принудительно отключить пользователя с уведомлением.
 *
 * Используется когда:
 * - Пользователь заблокирован
 * - Права полностью отозваны
 * - Роль понижена до уровня без доступа
 *
 * @example
 * await forceDisconnectUserWithReason(io, userId, 'Аккаунт заблокирован администратором')
 */
export async function forceDisconnectUserWithReason(
  io: Server,
  userId: number,
  reason: string
): Promise<void> {
  const sockets = await io.fetchSockets()
  const userSocket = sockets.find(s => s.data.userId === userId)

  if (!userSocket) {
    console.log(`[UserHandler] ⚠️ User ${userId} не подключён, отключение не требуется`)
    return
  }

  // Отправляем уведомление с причиной
  userSocket.emit('force:disconnect', {
    reason,
    timestamp: new Date().toISOString()
  })

  // Разрываем соединение
  userSocket.disconnect(true)

  console.log(`[UserHandler] 🔌 Принудительно отключён user=${userId}: ${reason}`)
}

// ============================================
// ОСНОВНОЙ ОБРАБОТЧИК
// ============================================

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
            ),
            // ✅ ДОБАВЬ: Исключаем сессии с endedAt (явно закрытые)
            isNull(userSessions.endedAt)
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
      invalidateOnlineCache()

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

      await db
        .update(userSessions)
        .set({ isActiveTab: false })
        .where(
          and(
            eq(userSessions.userId, user.id),
            ne(userSessions.sessionId, sessionId)
          )
        )

      await updateSessionStatus(sessionId, 'online', {
        tabId,
        currentPath,
        isActiveTab: true
      })

      // ✅ DEBOUNCE вместо немедленной отправки
      const { scheduleOnlineBroadcast } = await import('../../utils/online-broadcast')
      scheduleOnlineBroadcast(io)

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

      // ✅ DEBOUNCE вместо немедленной отправки
      const { scheduleOnlineBroadcast } = await import('../../utils/online-broadcast')
      scheduleOnlineBroadcast(io)

    } catch (error) {
      console.error('Ошибка обработки навигации:', error)
    }
  })

  // ============================================
  // 🆕 ЗАПРОС ПРОВЕРКИ ПРАВ (от клиента)
  // ============================================
  // Клиент может запросить актуальные права, если подозревает что они изменились
  socket.on('permissions:check', async () => {
    try {
      console.log(`[UserHandler] 🔍 User ${user.id} запросил проверку прав`)

      // Инвалидируем кэш и получаем свежие права
      invalidatePermissionsCache(user.id)

      // Отправляем подтверждение (клиент сам сделает запрос к /api/permissions)
      socket.emit('permissions:check:ack', {
        timestamp: new Date().toISOString(),
        message: 'Кэш прав инвалидирован. Перезагрузите права через /api/permissions'
      })
    } catch (error) {
      console.error('[UserHandler] Ошибка проверки прав:', error)
      socket.emit('error', {
        code: 'PERMISSIONS_CHECK_ERROR',
        message: 'Не удалось проверить права'
      })
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

        await updateSessionStatus(sessionId, 'offline')

        console.log(`   ✅ Сессия ${sessionId} помечена как оффлайн (endedAt установлен)`)

        // ✅ НЕМЕДЛЕННАЯ ОТПРАВКА (вход/выход — критичные события)
        const { immediateOnlineBroadcast } = await import('../../utils/online-broadcast')
        await immediateOnlineBroadcast(io)

        broadcastStatus(io, socket, user.id, userName, 'offline', {
          sessionId
        })

        console.log(`   📡 Список отправлен`)
      } else {
        console.warn('   ID сессии не найден для отключившегося пользователя')
      }

    } catch (error) {
      console.error('❌ Ошибка обработки отключения:', error)
    }
  })

  // ============================================
  // ОШИБКИ
  // ============================================
  socket.on('error', (error: any) => {
    console.error(`❌ Socket error for user ${user.id}:`, error)
  })
}
