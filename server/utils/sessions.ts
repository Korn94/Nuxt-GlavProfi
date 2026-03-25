// server/utils/sessions.ts
import { db } from '../db'
import { users, userSessions } from '../db/schema'
import { eq, and, sql, desc, or, count, max, lt } from 'drizzle-orm'
import { nanoid } from 'nanoid'

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
 * - Включение недавно вышедших (30 мин) для плавного исчезновения
 * - Умный выбор лучшей сессии (активная > неактивная, при равенстве — свежее)
 */
export async function getOnlineUsers() {
  const RECENT_OFFLINE_MINUTES = 30
  const AFK_THRESHOLD_MS = 5 * 60 * 1000 // 5 минут

  // Получаем сессии: online, afk + недавно вышедшие (для плавного исчезновения)
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
        and(
          eq(userSessions.status, 'offline'),
          sql`${userSessions.endedAt} > DATE_SUB(NOW(), INTERVAL ${RECENT_OFFLINE_MINUTES} MINUTE)`
        )
      )
    )
    .orderBy(desc(userSessions.lastActivity))

  // Агрегация: один пользователь = одна запись (по лучшей сессии)
  const usersMap = new Map<number, {
    userId: number
    user: { id: number; name: string; role: string; login: string }
    bestSession: any
  }>()

  for (const session of activeSessions) {
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

    // ✅ Выбираем лучшую сессию: активная > неактивная, при равенстве — по свежести
    if (!userData.bestSession) {
      userData.bestSession = session
    } else {
      const sessionIsActive = session.status !== 'offline'
      const bestIsActive = userData.bestSession.status !== 'offline'

      if (sessionIsActive && !bestIsActive) {
        userData.bestSession = session
      } else if (sessionIsActive === bestIsActive) {
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
      ipAddress: best.ipAddress || 'unknown'
      // ✅ tabsCount убран — не нужен
    }
  }).filter((u): u is NonNullable<typeof u> => u !== null)

  // Сортировка: online → afk → offline, затем по активности
  const order: Record<string, number> = { online: 0, afk: 1, offline: 2 }
  return result.sort((a, b) => {
    const diff = (order[a.status] ?? 2) - (order[b.status] ?? 2)
    if (diff !== 0) return diff
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  })
}
