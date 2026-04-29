// server/api/me.get.ts

import { eventHandler, getCookie, getRequestHeader, createError } from 'h3'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../utils/jwt'

export default eventHandler(async (event) => {
  const token = getCookie(event, 'auth_token') || getRequestHeader(event, 'Authorization')?.split(' ')[1]

  // 1. Нет токена — это НЕ ошибка, а нормальная ситуация для публичных страниц
  // Возвращаем пустой ответ, а не 401
  if (!token) {
    return { user: null }
  }

  try {
    const payload = await verifyToken(token)

    if (typeof payload.id !== 'number') {
      // Неверный токен — тоже не крашим, просто возвращаем null
      return { user: null }
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.id))

    // Пользователь не найден в БД — возвращаем null
    if (!user) {
      return { user: null }
    }

    // ✅ Успех: возвращаем безопасные данные пользователя
    return { 
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        // Не возвращайте чувствительные данные (пароль, токены и т.д.)
      } 
    }
    
  } catch (e) {
    // 2. Любая непредвиденная ошибка (БД, сеть, крипто) — логируем и возвращаем null
    // Это предотвратит краш SSR при проблемах с инфраструктурой
    console.error('[/api/me] Unexpected error:', e)
    
    // Важно: НЕ выбрасываем ошибку, чтобы не ломать рендеринг страницы
    return { user: null }
  }
})
