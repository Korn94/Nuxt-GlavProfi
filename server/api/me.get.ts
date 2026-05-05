// server/api/me.get.ts
import { eventHandler } from 'h3'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../utils/jwt'
import { extractJwt } from '../utils/cookies' // ✅ Централизованный хелпер

export default eventHandler(async (event) => {
  // ✅ Безопасно извлекаем JWT (поддержка старого и нового формата куки)
  const token = extractJwt(event)

  // 1. Нет токена — это НЕ ошибка, а нормальная ситуация для публичных страниц
  if (!token) {
    return { user: null }
  }

  try {
    const payload = await verifyToken(token)
    
    // Проверка формата payload.id
    if (typeof payload.id !== 'number') {
      return { user: null }
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.id))
    if (!user) {
      return { user: null }
    }

    // ✅ Возвращаем только публичные данные
    return {
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        name: user.name,
      }
    }
  } catch (error) {
    // 2. Ошибка верификации или БД — логируем и возвращаем null
    console.error('[/api/me] Ошибка верификации токена:', error)
    return { user: null }
  }
})
