// server/api/permissions.get.ts
/**
 * Эндпоинт для получения прав текущей роли
 * Используется клиентом для синхронизации после авторизации
 * 
 * ⚠️ Находится в PUBLIC_PATHS, поэтому сам проверяет токен через extractJwt
 */
import { defineEventHandler, createError } from 'h3'
import { verifyToken } from '../utils/jwt'
import { extractJwt } from '../utils/cookies' // ✅ Правильный хелпер
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getUserPermissionsResponse } from '../utils/permissions'

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ИЗВЛЕЧЕНИЕ ТОКЕНА
  // ============================================
  const token = extractJwt(event)

  if (!token) {
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Требуется авторизация' 
    })
  }

  try {
    // ============================================
    // 2. ВЕРИФИКАЦИЯ ТОКЕНА
    // ============================================
    const payload = await verifyToken(token)
    
    if (typeof payload.id !== 'number') {
      console.log('[Permissions] ⚠️ Некорректный payload.id')
      throw createError({ statusCode: 401, statusMessage: 'Неверный формат токена' })
    }

    // ============================================
    // 3. ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ИЗ БД
    // ============================================
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1)
    
    if (!user) {
      console.log(`[Permissions] ⚠️ Пользователь ${payload.id} не найден`)
      throw createError({ statusCode: 401, statusMessage: 'Пользователь не найден' })
    }

    // ============================================
    // 4. ВОЗВРАТ ПРАВ
    // ============================================
    return getUserPermissionsResponse(user)
    
  } catch (error) {
    console.error('[Permissions] Ошибка:', error)
    
    // Не раскрываем детали — общий 401
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Недействительный токен' 
    })
  }
})
