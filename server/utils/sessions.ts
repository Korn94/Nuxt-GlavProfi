// server/utils/sessions.ts
import { db } from '../db'
import { users, userSessions } from '../db/schema'
import { eq, and, sql, desc, or, count, max } from 'drizzle-orm'
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
 * @param userId ID пользователя
 * @param ipAddress IP-адрес
 * @param userAgent User-Agent браузера
 * @param tabId Уникальный ID вкладки (генерируется на клиенте)
 * @param currentPath Текущий путь страницы
 * @param isActiveTab Флаг активной вкладки
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
 * @param sessionId ID сессии
 * @param status Новый статус
 * @param updates Дополнительные поля для обновления
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
      lastActivity: userSessions.lastActivity
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
 * @param days Количество дней для хранения данных
 * @returns Количество удалённых записей
 */
export async function cleanupOldSessions(days: number = 30) {
  try {
    const result = await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.status, 'offline'),
          sql`${userSessions.endedAt} < DATE_SUB(NOW(), INTERVAL ${days} DAY)`
        )
      )
      .execute()
    
    const affectedRows = (result as any)[0]?.affectedRows || 0
    console.log(`[Cleanup] Removed ${affectedRows} old sessions`)
    return affectedRows
  } catch (error) {
    console.error('[Cleanup] Ошибка при очистке старых сеансов:', error)
    throw error
  }
}

/**
 * Получение онлайн-пользователей с агрегацией по пользователю
 * ОПТИМИЗИРОВАННАЯ ВЕРСИЯ с агрегацией на уровне SQL
 */
export async function getOnlineUsers() {
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
        eq(userSessions.status, 'afk')
      )
    )
    .orderBy(desc(userSessions.lastActivity))

  const usersMap = new Map<number, any>()

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
        sessions: [],
        tabsCount: 0
      })
    }

    const userData = usersMap.get(session.userId)!
    userData.sessions.push(session)
    userData.tabsCount += 1

    // ✅ ИСПРАВЛЕНО: Всегда выбираем сессию с самым свежим lastActivity
    if (!userData.activeSession || 
        (session.lastActivity && userData.activeSession.lastActivity && 
         new Date(session.lastActivity) > new Date(userData.activeSession.lastActivity))) {
      userData.activeSession = session
    }
  }

  const result = Array.from(usersMap.values()).map(userData => {
    const activeSession = userData.activeSession
    return {
      userId: userData.userId,
      user: userData.user,
      tabsCount: userData.tabsCount,
      activePath: activeSession?.currentPath || null,
      status: activeSession?.status || 'offline',
      lastActivity: activeSession?.lastActivity || new Date().toISOString(),
      startedAt: activeSession?.startedAt || new Date().toISOString(),
      ipAddress: activeSession?.ipAddress || 'unknown'
    }
  })

  return result.sort((a, b) => {
    if (b.tabsCount !== a.tabsCount) {
      return b.tabsCount - a.tabsCount
    }
    const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : Date.now()
    const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : Date.now()
    return dateB - dateA
  })
}
