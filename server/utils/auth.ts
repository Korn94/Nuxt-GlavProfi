// server/utils/auth.ts
/**
 * Назначение: Утилита верификации аутентификации пользователя
 * 
 * @param {H3Event} event — объект события H3
 * @returns { User } — данные пользователя из БД
 * @throws { 401 } — если токен отсутствует или невалиден
 * @throws { 404 } — если пользователь не найден в БД
 */

import { createError, H3Event, type EventHandlerRequest } from 'h3'
import { verifyToken } from './jwt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { extractJwt } from './cookies'

export async function verifyAuth(event: H3Event<EventHandlerRequest>) {
  // 🍪 Извлекаем JWT из cookies
  const token = extractJwt(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Токен отсутствует' })
  }

  // 🔐 Верифицируем токен
  let payload
  try {
    payload = await verifyToken(token)
  } catch (e) {
    console.log('[Auth/Utils] Ошибка верификации токена:', e)
    throw createError({ statusCode: 401, message: 'Невалидный или истёкший токен' })
  }

  // 👤 Получаем пользователя из БД
  const [user] = await db.select().from(users).where(eq(users.id, payload.id))
  if (!user) {
    throw createError({ statusCode: 404, message: 'Пользователь не найден' })
  }

  return user
}
