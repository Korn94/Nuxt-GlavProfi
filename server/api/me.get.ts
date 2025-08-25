// server/api/me.get.ts

import { eventHandler, getCookie, getRequestHeader, createError } from 'h3'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../utils/jwt'

export default eventHandler(async (event) => {
  const token = getCookie(event, 'token') || getRequestHeader(event, 'Authorization')?.split(' ')[1]

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const payload = await verifyToken(token)

    // Явно проверяем, что id существует и является числом
    if (typeof payload.id !== 'number') {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token payload' })
    }

    // Теперь TypeScript знает, что payload.id — это number
    const [user] = await db.select().from(users).where(eq(users.id, payload.id))

    if (!user) {
      throw createError({ statusCode: 404, statusMessage: 'User not found' })
    }

    return { user }
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
