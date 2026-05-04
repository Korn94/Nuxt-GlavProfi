// server/api/auth/check.get.ts
import { defineEventHandler, createError } from 'h3'
import { verifyToken } from '../../utils/jwt'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { extractJwt } from '../../utils/cookies'

export default defineEventHandler(async (event) => {
  const token = extractJwt(event)

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const payload = await verifyToken(token)
    if (typeof payload.id !== 'number') {
      throw createError({ statusCode: 401, statusMessage: 'Invalid token payload' })
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.id))
    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'User not found' })
    }

    return {
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        name: user.name,
      }
    }
  } catch (error) {
    console.error('[Auth/Check] Ошибка проверки токена:', error)
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
