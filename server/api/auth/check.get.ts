// server/api/auth/check.get.ts
import { defineEventHandler, createError, getCookie, getRequestHeader } from 'h3'
import { verifyToken } from '../../utils/jwt'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Используем auth_token вместо token
  const token = getCookie(event, 'auth_token') || getRequestHeader(event, 'Authorization')?.split(' ')[1]
  
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  
  try {
    const payload = await verifyToken(token)
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
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
