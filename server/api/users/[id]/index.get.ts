// server/api/users/[id]/index.get.ts
/**
 * Назначение: Получение данных конкретного пользователя по ID
 * ⚠️ Требует роль `manager` (проверяется в мидлваре)
 * 
 * @param {string} id — ID пользователя (из пути)
 * @returns { User } — данные пользователя (без пароля)
 */

import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { users } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const idParam = getRouterParam(event, 'id')
  
  if (!idParam) throw createError({ statusCode: 400, message: 'ID пользователя обязателен' })
  
  const id = parseInt(idParam, 10)
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный формат ID' })

  try {
    const [user] = await db.select().from(users).where(eq(users.id, id))
    
    if (!user) throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    
    // ✅ Возвращаем безопасные данные (без пароля)
    const { password, ...safeUser } = user
    return safeUser
    
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error('[API/Users/Get] Ошибка:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
