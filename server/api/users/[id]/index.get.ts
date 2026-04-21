// server/api/users/[id]/index.get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { users } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  
  // ✅ Валидация: проверяем, что ID существует и это число
  if (!idParam) {
    throw createError({ 
      statusCode: 400, 
      message: 'ID пользователя обязателен' 
    })
  }
  
  const id = parseInt(idParam, 10)
  if (isNaN(id)) {
    throw createError({ 
      statusCode: 400, 
      message: 'Неверный формат ID пользователя' 
    })
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
    
    if (!user) {
      throw createError({ 
        statusCode: 404, 
        message: 'Пользователь не найден' 
      })
    }
    
    // ✅ Возвращаем безопасные данные (без пароля)
    const { password, ...safeUser } = user
    return safeUser
  } catch (error: any) {
    // Пропускаем наши ошибки, логируем только неизвестные
    if (error.statusCode) throw error
    
    console.error('Ошибка получения пользователя:', error)
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при получении пользователя'
    })
  }
})
