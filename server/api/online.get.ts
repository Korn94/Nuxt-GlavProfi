/**
 * 📍 Эндпоинт: GET /api/online
 * 
 * Назначение:
 * - Возврат списка онлайн-пользователей с их статусами (online/afk/offline)
 * - Агрегация данных из таблицы `userSessions` + информация о пользователях
 * - Кэширование на 2 секунды для снижения нагрузки на БД при частых запросах
 * - Используется в кабинете для отображения списка активных коллег
 * 
 * 
 * @returns { 
 *   users: OnlineUser[], 
 *   total: number, 
 *   online: number, 
 *   afk: number 
 * }
 */

import { eventHandler, createError } from 'h3'
import { getOnlineUsers } from '../utils/sessions'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

// ============================================
// КЭШИРОВАНИЕ (на 2 секунды)
// ============================================
/**
 * Кэш для снижения нагрузки на БД при частых запросах
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

// ============================================
// ОБРАБОТЧИК ЗАПРОСА
// ============================================
export default eventHandler(async (event) => {
  const now = Date.now()
  
  // ============================================
  // 1. ПРОВЕРКА КЭША
  // ============================================
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    console.log('[API/Online] 💾 Cache hit - возвращаем кэшированные данные')
    return cache.data
  }
  
  console.log('[API/Online] 📥 Cache miss - запрос к БД...')
  
  try {
    // ============================================
    // 2. ПОЛУЧЕНИЕ ДАННЫХ ИЗ БД
    // ============================================
    // ✅ Авторизация уже проверена мидлваром!
    // Если нужен текущий пользователь:
    // const currentUser = event.context.user
    
    // Получаем агрегированные сессии (онлайн-статусы)
    const sessions = await getOnlineUsers()
    
    // ✅ Гарантируем, что сессии всегда массив (защита от null/undefined)
    const sessionsArray = sessions || []
    
    // Обогащаем сессии данными пользователей из БД
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
    
    // ✅ Фильтруем сессии без пользователя (защита от «битых» данных)
    const validSessions = sessionsWithUsers.filter(
      (session) => session.user !== undefined && session.user !== null
    )
    
    // ============================================
    // 3. ФОРМИРОВАНИЕ ОТВЕТА
    // ============================================
    const response = {
      users: validSessions,
      total: validSessions.length,
      online: validSessions.filter(s => s.status === 'online').length,
      afk: validSessions.filter(s => s.status === 'afk').length
    }
    
    // ============================================
    // 4. СОХРАНЕНИЕ В КЭШ
    // ============================================
    cache = {
      data: response,
      timestamp: now
    }
    
    console.log(`[API/Online] ✅ Закешировано ${validSessions.length} пользователей (TTL: ${CACHE_DURATION}ms)`)
    
    return response
    
  } catch (error) {
    // ============================================
    // 5. ОБРАБОТКА ОШИБОК
    // ============================================
    console.error('[API/Online] ❌ Ошибка получения онлайн-пользователей:', error)
    
    // ❌ Выбрасываем 500, так как это внутренняя ошибка сервера
    // (не 401/403 — авторизация уже проверена мидлваром)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось загрузить список онлайн-пользователей'
    })
  }
})
