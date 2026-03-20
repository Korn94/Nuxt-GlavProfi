// server/utils/auth.ts

import { createError, getCookie, getRequestHeader, H3Event, type EventHandlerRequest } from 'h3'
import { verifyToken } from './jwt'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'

export async function verifyAuth(event: H3Event<EventHandlerRequest>) {
  const token = getCookie(event, 'auth_token') || getRequestHeader(event, 'Authorization')?.split(' ')[1]
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const payload = await verifyToken(token)
  const [user] = await db.select().from(users).where(eq(users.id, payload.id))
  if (!user) throw createError({ statusCode: 404, statusMessage: 'User not found' })

  return user
}
