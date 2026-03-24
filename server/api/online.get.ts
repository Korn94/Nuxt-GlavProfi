// server/api/online.get.ts
import { eventHandler, createError } from 'h3'
import { getOnlineUsers } from '../utils/sessions'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Кэширование онлайн-пользователей
 * ✅ УМЕНЬШЕНО: с 5 до 2 секунд для более актуальных данных
 */
const CACHE_DURATION = 2000 // 2 секунды
let cache: {
  data: any
  timestamp: number
} | null = null

/**
 * ✅ ФУНКЦИЯ ДЛЯ ПРИНУДИТЕЛЬНОЙ ИНВАЛИДАЦИИ КЭША
 * Вызывается из сокет-обработчиков при вход/выход пользователей
 */
export const invalidateOnlineCache = () => {
  cache = null
  console.log('[API/Online] 🗑️ Кэш инвалидирован')
}

export default eventHandler(async (event) => {
  const now = Date.now()
  
  // ✅ Проверяем кэш
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    console.log('[API/Online] 💾 Cache hit - returning cached data')
    return cache.data
  }
  
  console.log('[API/Online] 📥 Cache miss - querying database...')
  
  try {
    // Получаем онлайн-пользователей
    const sessions = await getOnlineUsers()
    
    // ✅ ГАРАНТИРУЕМ, ЧТО СЕССИИ ВСЕГДА МАССИВ
    const sessionsArray = sessions || []
    
    // Получаем информацию о пользователях
    const sessionsWithUsers = await Promise.all(
      sessionsArray.map(async (session) => {
        const [user] = await db
          .select({
            name: users.name,
            role: users.role,
            login: users.login
          })
          .from(users)
          .where(eq(users.id, session.userId))
        
        return {
          ...session,
          user: user || undefined
        }
      })
    )
    
    // ✅ ФИЛЬТРУЕМ СЕССИИ БЕЗ ПОЛЬЗОВАТЕЛЯ
    const validSessions = sessionsWithUsers.filter(
      (session) => session.user !== undefined && session.user !== null
    )
    
    // Формируем ответ
    const response = {
      users: validSessions,
      total: validSessions.length,
      online: validSessions.filter(s => s.status === 'online').length,
      afk: validSessions.filter(s => s.status === 'afk').length
    }
    
    // ✅ Сохраняем в кэш
    cache = {
      data: response,
      timestamp: now
    }
    
    console.log(`[API/Online] ✅ Cached ${validSessions.length} users (TTL: ${CACHE_DURATION}ms)`)
    
    return response
    
  } catch (error) {
    console.error('[API/Online] ❌ Error fetching online users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch online users'
    })
  }
})
