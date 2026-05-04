// server/utils/auth.ts
import { createError, H3Event, type EventHandlerRequest } from 'h3'
import { verifyToken } from './jwt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { extractJwt } from './cookies'

export async function verifyAuth(event: H3Event<EventHandlerRequest>) {
  const token = extractJwt(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Токен отсутствует' })
  }

  let payload
  try {
    payload = await verifyToken(token)
  } catch (e) {
    console.log('[Auth/Utils] Ошибка верификации токена:', e)
    throw createError({ statusCode: 401, statusMessage: 'Невалидный или истёкший токен' })
  }

  const [user] = await db.select().from(users).where(eq(users.id, payload.id))
  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Пользователь не найден в базе' })
  }

  return user
}
