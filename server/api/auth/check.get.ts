// server/api/auth/check.get.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../../utils/jwt'
import { extractJwt } from '../../utils/cookies' // ✅ Центральный хелпер парсинга куки

export default defineEventHandler(async (event) => {
  // ✅ Безопасно извлекаем JWT (поддержка старого и нового формата куки)
  const token = extractJwt(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }

  try {
    const payload = await verifyToken(token)
    
    // ✅ Строгая проверка формата payload.id
    if (typeof payload.id !== 'number') {
      throw createError({ statusCode: 401, statusMessage: 'Неверный формат токена' })
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.id))
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Пользователь не найден' })
    }

    // ✅ Возвращаем данные в формате, ожидаемом authStore
    return {
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  } catch (error) {
    console.error('[Auth/Check] Ошибка проверки токена:', error)
    // ✅ Не раскрываем детали ошибки клиенту, возвращаем общий 401
    throw createError({ statusCode: 401, statusMessage: 'Недействительный токен' })
  }
})
