// server/api/works/daily-work/active-objects.get.ts
import { defineEventHandler, getCookie, createError } from 'h3'
import { db } from '../../../db'
import { objects, users } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  try {
    // 1. Получаем токен из куки
    const token = getCookie(event, 'auth_token')
    
    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Требуется авторизация'
      })
    }

    // 2. Верифицируем токен
    const payload = await verifyToken(token)
    
    if (typeof payload.id !== 'number') {
      throw createError({
        statusCode: 401,
        message: 'Невалидный токен'
      })
    }

    // 3. Получаем пользователя
    const [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      })
    }

    // 4. Если прораб — фильтруем по его объектам
    if (currentUser.role === 'foreman' && currentUser.contractorId) {
      return await db
        .select({
          id: objects.id,
          name: objects.name,
          status: objects.status
        })
        .from(objects)
        .where(
          eq(objects.status, 'active')
        )
        .orderBy(objects.name)
    }

    // 5. Админы и менеджеры видят все активные объекты
    return await db
      .select({
        id: objects.id,
        name: objects.name,
        status: objects.status
      })
      .from(objects)
      .where(eq(objects.status, 'active'))
      .orderBy(objects.name)

  } catch (error: any) {
    console.error('[API] Ошибка получения активных объектов:', error)
    
    if (error.statusCode === 401 || error.statusCode === 404) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Не удалось загрузить список объектов'
    })
  }
})
