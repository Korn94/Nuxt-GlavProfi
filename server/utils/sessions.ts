// server/utils/sessions.ts
import { db } from '../db'
import { users, userSessions } from '../db/schema'
import { eq, and, sql, desc, or, isNull, inArray, isNotNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'

/**
 * Определение типа устройства по user-agent
 */
function getDeviceType(userAgent?: string): 'desktop' | 'mobile' | 'unknown' {
  if (!userAgent) return 'unknown'

  const ua = userAgent.toLowerCase()

  // Мобильные устройства
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini|fennec|webos/i.test(ua)) {
    return 'mobile'
  }

  // Планшеты (iPad, Android планшеты)
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'mobile'
  }

  // Десктоп
  return 'desktop'
}

/**
 * Форматирование даты для MySQL (локальное время МСК)
 */
export function formatMySQLDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * Создание новой сессии при входе пользователя
 */
export async function createSession(
  userId: number,
  ipAddress?: string,
  userAgent?: string,
  tabId?: string,
  currentPath?: string,
  isActiveTab: boolean = true
) {
  const sessionId = `sess_${nanoid(16)}`

  // Вставляем сессию с новыми полями
  await db.insert(userSessions).values({
    userId,
    sessionId,
    status: 'online',
    isActiveTab,
    tabId,
    currentPath,
    ipAddress,
    userAgent,
    startedAt: formatMySQLDate(new Date()),
    lastActivity: formatMySQLDate(new Date())
  })

  // Получаем созданную сессию
  const [session] = await db
    .select({
      id: userSessions.id,
      sessionId: userSessions.sessionId,
      status: userSessions.status,
      isActiveTab: userSessions.isActiveTab,
      tabId: userSessions.tabId,
      currentPath: userSessions.currentPath,
      startedAt: userSessions.startedAt,
      lastActivity: userSessions.lastActivity
    })
    .from(userSessions)
    .where(eq(userSessions.sessionId, sessionId))

  return session
}

/**
 * Обновление статуса и данных сессии
 * ❌ ИЗМЕНЕНО: При статусе 'offline' больше НЕ ставится endedAt
 * endedAt устанавливается только cleanup-процессом через 15 минут бездействия
 * Это предотвращает спам сессий при F5 (см. P0.3)
 */
export async function updateSessionStatus(
  sessionId: string,
  status: 'online' | 'afk' | 'offline',
  updates?: {
    ipAddress?: string
    currentPath?: string
    isActiveTab?: boolean
    tabId?: string
  }
) {
  const updateData: any = {
    status,
    lastActivity: formatMySQLDate(new Date())
  }

  // ❌ Больше НЕ ставим endedAt при offline — это ломало мультивкладочность
  // и создавало спам сессий при F5. endedAt ставится только cleanup-процессом.
  // if (status === 'offline') {
  //   updateData.endedAt = formatMySQLDate(new Date())
  // }

  // Обновляем только переданные поля
  if (updates) {
    if (updates.ipAddress !== undefined) updateData.ipAddress = updates.ipAddress
    if (updates.currentPath !== undefined) updateData.currentPath = updates.currentPath
    if (updates.isActiveTab !== undefined) updateData.isActiveTab = updates.isActiveTab
    if (updates.tabId !== undefined) updateData.tabId = updates.tabId
  }

  // Обновляем сессию
  await db
    .update(userSessions)
    .set(updateData)
    .where(eq(userSessions.sessionId, sessionId))

  // Получаем обновлённую сессию
  const [session] = await db
    .select({
      id: userSessions.id,
      sessionId: userSessions.sessionId,
      status: userSessions.status,
      isActiveTab: userSessions.isActiveTab,
      tabId: userSessions.tabId,
      currentPath: userSessions.currentPath,
      lastActivity: userSessions.lastActivity,
      endedAt: userSessions.endedAt
    })
    .from(userSessions)
    .where(eq(userSessions.sessionId, sessionId))

  return session
}

/**
 * Завершение сессии при выходе пользователя
 */
export async function endSession(sessionId: string) {
  await db
    .update(userSessions)
    .set({
      status: 'offline',
      endedAt: formatMySQLDate(new Date())
    })
    .where(eq(userSessions.sessionId, sessionId))

  const [session] = await db
    .select({
      id: userSessions.id,
      sessionId: userSessions.sessionId,
      endedAt: userSessions.endedAt
    })
    .from(userSessions)
    .where(eq(userSessions.sessionId, sessionId))

  return session
}

/**
 * Получение сессий конкретного пользователя
 */
export async function getUserSessions(userId: number) {
  return await db
    .select({
      id: userSessions.id,
      sessionId: userSessions.sessionId,
      status: userSessions.status,
      isActiveTab: userSessions.isActiveTab,
      tabId: userSessions.tabId,
      currentPath: userSessions.currentPath,
      lastActivity: userSessions.lastActivity,
      startedAt: userSessions.startedAt,
      endedAt: userSessions.endedAt,
      ipAddress: userSessions.ipAddress,
      userAgent: userSessions.userAgent
    })
    .from(userSessions)
    .where(eq(userSessions.userId, userId))
    .orderBy(desc(userSessions.lastActivity))
}

/**
 * Очистка старых сессий (старше указанного количества дней)
 * ✅ ИСПРАВЛЕНО: Теперь чистит и с endedAt, и без него (зомби-сессии)
 */
export async function cleanupOldSessions(days: number = 30) {
  try {
    // ✅ Чистим сессии со статусом offline и endedAt старше N дней
    const result1 = await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.status, 'offline'),
          sql`${userSessions.endedAt} < DATE_SUB(NOW(), INTERVAL ${days} DAY)`
        )
      )
      .execute()

    // ✅ Чистим "зомби"-сессии: статус online/afk, но lastActivity старше 2 часов
    // Это страховка на случай обрыва соединения без disconnect
    const result2 = await db
      .delete(userSessions)
      .where(
        and(
          or(
            eq(userSessions.status, 'online'),
            eq(userSessions.status, 'afk')
          ),
          sql`${userSessions.lastActivity} < DATE_SUB(NOW(), INTERVAL 2 HOUR)`
        )
      )
      .execute()

    const affectedRows1 = (result1 as any)[0]?.affectedRows || 0
    const affectedRows2 = (result2 as any)[0]?.affectedRows || 0
    const total = affectedRows1 + affectedRows2

    console.log(`[Cleanup] Removed ${total} old sessions (${affectedRows1} ended + ${affectedRows2} zombie)`)
    return total
  } catch (error) {
    console.error('[Cleanup] Ошибка при очистке старых сеансов:', error)
    throw error
  }
}

/**
 * ✅ НОВАЯ ФУНКЦИЯ: Очистка зомби-сессий для конкретного пользователя
 * Вызывается при создании новой сессии, чтобы закрыть старые
 */
export async function closeZombieSessions(userId: number, excludeSessionId?: string) {
  try {
    const updateData: any = {
      status: 'offline',
      endedAt: formatMySQLDate(new Date())
    }

    const conditions = [
      eq(userSessions.userId, userId),
      or(
        eq(userSessions.status, 'online'),
        eq(userSessions.status, 'afk')
      )
    ]

    // Исключаем текущую сессию если передан sessionId
    if (excludeSessionId) {
      conditions.push(sql`${userSessions.sessionId} != ${excludeSessionId}`)
    }

    await db
      .update(userSessions)
      .set(updateData)
      .where(and(...conditions))

    console.log(`[Sessions] Closed zombie sessions for user ${userId}`)
  } catch (error) {
    console.error('[Sessions] Error closing zombie sessions:', error)
  }
}

/**
 * Получение онлайн-пользователей с агрегацией по пользователю
 *
 * ✅ АРХИТЕКТУРА (P0.2):
 * 1. Активные (online/afk) — из userSessions (быстро, мало записей)
 * 2. Offline — из users.lastSeenAt (O(1), без сканирования сессий)
 *
 * Это позволяет:
 * - Показывать ВСЕХ пользователей системы на странице "Онлайн"
 * - Не сканировать миллионы offline-сессий
 * - Использовать users.lastSeenAt для "был в сети: N минут назад"
 */
export async function getOnlineUsers() {
  const AFK_THRESHOLD_MS = 5 * 60 * 1000 // 5 минут
  const now = new Date()

  // ============================================
  // 1. ПОЛУЧАЕМ АКТИВНЫХ ПОЛЬЗОВАТЕЛЕЙ (online/afk)
  // ============================================
  const activeSessions = await db
    .select({
      sessionId: userSessions.sessionId,
      userId: userSessions.userId,
      status: userSessions.status,
      isActiveTab: userSessions.isActiveTab,
      tabId: userSessions.tabId,
      currentPath: userSessions.currentPath,
      lastActivity: userSessions.lastActivity,
      startedAt: userSessions.startedAt,
      endedAt: userSessions.endedAt,
      ipAddress: userSessions.ipAddress,
      userAgent: userSessions.userAgent,
      userName: users.name,
      userRole: users.role,
      userLogin: users.login
    })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(
      or(
        eq(userSessions.status, 'online'),
        eq(userSessions.status, 'afk')
      )
    )
    .orderBy(desc(userSessions.lastActivity))

  // Агрегация: один пользователь = одна запись (по лучшей сессии)
  const activeUsersMap = new Map<number, {
    sessionId: string
    userId: number
    status: string
    isActiveTab: boolean
    tabId: string | null
    currentPath: string | null
    lastActivity: string | null
    startedAt: string | null
    endedAt: string | null
    ipAddress: string | null
    userAgent: string | null
    userName: string
    userRole: string
    userLogin: string
  }>()

  for (const session of activeSessions) {
    if (!activeUsersMap.has(session.userId)) {
      activeUsersMap.set(session.userId, session)
    } else {
      const existing = activeUsersMap.get(session.userId)!
      const existingPriority = existing.status === 'online' ? 0 : 1
      const sessionPriority = session.status === 'online' ? 0 : 1

      if (sessionPriority < existingPriority) {
        activeUsersMap.set(session.userId, session)
      } else if (sessionPriority === existingPriority) {
        const existingTime = new Date(existing.lastActivity || 0).getTime()
        const sessionTime = new Date(session.lastActivity || 0).getTime()
        if (sessionTime > existingTime) {
          activeUsersMap.set(session.userId, session)
        }
      }
    }
  }

  // ============================================
  // 2. ПОЛУЧАЕМ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ СИСТЕМЫ
  // ============================================
  // Один быстрый запрос — все пользователи с их последним визитом
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      login: users.login,
      lastSeenAt: users.lastSeenAt
    })
    .from(users)
    .where(isNull(users.deletedAt)) // Не показываем удалённых
    .orderBy(desc(users.lastSeenAt))

  // ============================================
  // 3. ПОЛУЧАЕМ ПОСЛЕДНИЙ ПУТЬ ДЛЯ OFFLINE-ПОЛЬЗОВАТЕЛЕЙ
  // ============================================
  // Для тех, кто заходил (lastSeenAt не null), достаём последний currentPath
  // из их последней завершённой сессии (один запрос для всех)
  const offlineUserIds = allUsers
    .filter(u => u.lastSeenAt && !activeUsersMap.has(u.id))
    .map(u => u.id)

  const lastPathsMap = new Map<number, string | null>()

  if (offlineUserIds.length > 0) {
    // Берём последнюю сессию для каждого offline-пользователя с известным путём
    const lastSessions = await db
      .select({
        userId: userSessions.userId,
        currentPath: userSessions.currentPath,
        lastActivity: userSessions.lastActivity
      })
      .from(userSessions)
      .where(
        and(
          inArray(userSessions.userId, offlineUserIds),
          isNotNull(userSessions.currentPath)
        )
      )
      .orderBy(desc(userSessions.lastActivity))

    // Группируем: для каждого userId оставляем только последний путь
    for (const session of lastSessions) {
      if (!lastPathsMap.has(session.userId)) {
        lastPathsMap.set(session.userId, session.currentPath)
      }
    }
  }

  // ============================================
  // 4. ОБЪЕДИНЯЕМ РЕЗУЛЬТАТЫ
  // ============================================
  const result = allUsers.map(user => {
    const activeSession = activeUsersMap.get(user.id)

    // Пользователь активен (online/afk)
    if (activeSession) {
      let status = activeSession.status

      // Автоопределение AFK: online без активности >5 минут → afk
      if (status === 'online' && activeSession.lastActivity) {
        const lastActivityTime = new Date(activeSession.lastActivity).getTime()
        const diff = now.getTime() - lastActivityTime
        if (diff > AFK_THRESHOLD_MS) {
          status = 'afk'
        }
      }

      return {
        userId: user.id,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          login: user.login
        },
        activePath: activeSession.currentPath || null,
        status: status as 'online' | 'afk',
        lastActivity: activeSession.lastActivity || now.toISOString(),
        startedAt: activeSession.startedAt || now.toISOString(),
        endedAt: activeSession.endedAt || null,
        ipAddress: activeSession.ipAddress || 'unknown',
        deviceType: getDeviceType(activeSession.userAgent || undefined)
      }
    }

    // Пользователь offline — используем lastSeenAt из таблицы users
    return {
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        login: user.login
      },
      activePath: lastPathsMap.get(user.id) || null, // последний известный путь
      status: 'offline' as const,
      lastActivity: user.lastSeenAt, // null = никогда не заходил
      startedAt: null,
      endedAt: user.lastSeenAt || null, // Для компонента "Вышел: ..."
      ipAddress: 'unknown',
      deviceType: 'unknown' as const
    }
  })

  // Сортировка: online → afk → offline, затем по активности, затем по userId (стабильность!)
  const order: Record<string, number> = { online: 0, afk: 1, offline: 2 }
  return result.sort((a, b) => {
    const statusDiff = (order[a.status] ?? 2) - (order[b.status] ?? 2)
    if (statusDiff !== 0) return statusDiff

    const aTime = new Date(a.lastActivity || 0).getTime()
    const bTime = new Date(b.lastActivity || 0).getTime()
    const timeDiff = bTime - aTime
    if (timeDiff !== 0) return timeDiff

    // ✅ Tie-breaker: сортировка по userId для стабильности
    return a.userId - b.userId
  })
}
