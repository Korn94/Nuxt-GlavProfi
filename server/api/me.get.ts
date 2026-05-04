// server/api/me.get.ts
import { eventHandler } from 'h3'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../utils/jwt'
import { extractJwt } from '../utils/cookies'

export default eventHandler(async (event) => {
  const token = extractJwt(event)

  // 1. Нет токена — это НЕ ошибка, а нормальная ситуация для публичных страниц
  if (!token) {
    return { user: null }
  }

  try {
    const payload = await verifyToken(token)
    if (typeof payload.id !== 'number') {
      // Неверный токен — возвращаем null, а не крашим SSR
      return { user: null }
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.id))
    if (!user) {
      return { user: null }
    }

    // ✅ Успех: возвращаем безопасные данные пользователя
    return {
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    }
  } catch (e) {
    // 2. Любая непредвиденная ошибка — логируем и возвращаем null
    // Это предотвратит краш SSR при проблемах с инфраструктурой
    console.error('[/api/me] Ошибка верификации токена:', e)
    return { user: null }
  }
})
