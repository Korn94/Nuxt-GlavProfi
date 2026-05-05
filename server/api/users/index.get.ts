// server/api/users/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../db'
import { users } from '../../db/schema'
import { verifyToken } from '../../utils/jwt'
import { extractJwt } from '../../utils/cookies' // ✅ Централизованный хелпер

export default eventHandler(async (event) => {
  // ✅ Безопасно извлекаем JWT из куки (поддержка старого и нового формата)
  const token = extractJwt(event)
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }

  try {
    const payload = await verifyToken(token)
    
    // Загружаем всех пользователей из БД
    const allUsers = await db.select().from(users)
    
    // ✅ Исключаем пароли из ответа (безопасность)
    // Drizzle возвращает все поля, нам нужно "вычистить" чувствительные данные
    const safeUsers = allUsers.map(({ password, ...user }) => user)
    
    return { users: safeUsers }
  } catch (e) {
    console.error('[API/Users] Ошибка верификации токена:', e)
    throw createError({ statusCode: 401, statusMessage: 'Невалидный токен' })
  }
})
