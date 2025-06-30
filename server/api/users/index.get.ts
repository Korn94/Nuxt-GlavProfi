// server/api/users/get.ts
import { eventHandler } from 'h3'
import { db } from '../../db'
import { users } from '../../db/schema'
import { verifyToken } from '~/server/utils/jwt'
import { getCookie, getRequestHeader, createError } from 'h3'

export default eventHandler(async (event) => {
  const token = getCookie(event, 'token') || getRequestHeader(event, 'Authorization')?.split(' ')[1]

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const payload = await verifyToken(token)
    const allUsers = await db.select().from(users)
    return { users: allUsers }
  } catch (e) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid token' })
  }
})
