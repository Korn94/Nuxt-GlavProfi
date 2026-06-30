// server/utils/sessions.ts
import { db } from '../db'
import { users, userSessions } from '../db/schema'
import { eq, and, sql, desc, or } from 'drizzle-orm'
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
function formatMySQLDate(date: Date): string {
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
 * ✅ ИСПРАВЛЕНО: При статусе 'offline' теперь ставится endedAt
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

  // ✅ КРИТИЧНО: При статусе offline ставим endedAt
  if (status === 'offline') {
    updateData.endedAt = formatMySQLDate(new Date())
  }

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
 * ✅ УЛУЧШЕНИЯ:
 * - Авто-определение AFK по lastActivity (>5 мин бездействия)
 * - Offline-пользователи показываются всегда (с последним временем активности)
 * - Умный выбор лучшей сессии (активная > неактивная, при равенстве — свежее)
 */
export async function getOnlineUsers() {
  const AFK_THRESHOLD_MS = 5 * 60 * 1000 // 5 минут

  // Получаем все сессии: online, afk + offline (для отображения последнего времени активности)
  const allSessions = await db
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
        eq(userSessions.status, 'afk'),
        eq(userSessions.status, 'offline')
      )
    )
    .orderBy(desc(userSessions.lastActivity))

  // Агрегация: один пользователь = одна запись (по лучшей сессии)
  const usersMap = new Map<number, {
    userId: number
    user: { id: number; name: string; role: string; login: string }
    bestSession: any
  }>()

  for (const session of allSessions) {
    if (!usersMap.has(session.userId)) {
      usersMap.set(session.userId, {
        userId: session.userId,
        user: {
          id: session.userId,
          name: session.userName,
          role: session.userRole,
          login: session.userLogin
        },
        bestSession: null
      })
    }

    const userData = usersMap.get(session.userId)!

    // ✅ Выбираем лучшую сессию: online > afk > offline, при равенстве — по свежести
    if (!userData.bestSession) {
      userData.bestSession = session
    } else {
      const sessionPriority = session.status === 'online' ? 0 : session.status === 'afk' ? 1 : 2
      const bestPriority = userData.bestSession.status === 'online' ? 0 : userData.bestSession.status === 'afk' ? 1 : 2

      if (sessionPriority < bestPriority) {
        userData.bestSession = session
      } else if (sessionPriority === bestPriority) {
        const sessionTime = session.lastActivity ? new Date(session.lastActivity).getTime() : 0
        const bestTime = userData.bestSession.lastActivity
          ? new Date(userData.bestSession.lastActivity).getTime()
          : 0
        if (sessionTime > bestTime) {
          userData.bestSession = session
        }
      }
    }
  }

  // Формируем результат с авто-определением AFK
  const now = new Date()
  const result = Array.from(usersMap.values()).map(userData => {
    const best = userData.bestSession
    if (!best) return null

    // ✅ Авто-определение AFK: если статус online, но нет активности >5 мин
    // Для offline-пользователей оставляем статус как есть
    let status = best.status
    if (status === 'online' && best.lastActivity) {
      const lastActivityTime = new Date(best.lastActivity).getTime()
      const diff = now.getTime() - lastActivityTime
      if (diff > AFK_THRESHOLD_MS) {
        status = 'afk'
      }
    }

    return {
      userId: userData.userId,
      user: userData.user,
      activePath: best.currentPath || null,
      status: status as 'online' | 'afk' | 'offline',
      lastActivity: best.lastActivity || now.toISOString(),
      startedAt: best.startedAt || now.toISOString(),
      endedAt: best.endedAt || null,
      ipAddress: best.ipAddress || 'unknown',
      deviceType: getDeviceType(best.userAgent || undefined)
    }
  }).filter((u): u is NonNullable<typeof u> => u !== null)

  // Сортировка: online → afk → offline, затем по активности (для offline — по endedAt/lastActivity)
  const order: Record<string, number> = { online: 0, afk: 1, offline: 2 }
  return result.sort((a, b) => {
    const diff = (order[a.status] ?? 2) - (order[b.status] ?? 2)
    if (diff !== 0) return diff

    // Для offline-пользователей используем endedAt если есть, иначе lastActivity
    const aTime = a.status === 'offline' && a.endedAt
      ? new Date(a.endedAt).getTime()
      : new Date(a.lastActivity).getTime()
    const bTime = b.status === 'offline' && b.endedAt
      ? new Date(b.endedAt).getTime()
      : new Date(b.lastActivity).getTime()

    return bTime - aTime
  })
}
