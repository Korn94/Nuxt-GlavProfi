// server/api/users/[id]/get.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { users } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID пользователя обязателен' })
  }

  try {
    const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)))
    if (!user) {
      throw createError({ statusCode: 404, message: 'Пользователь не найден' })
    }
    return user
  } catch (error) {
    console.error('Ошибка получения пользователя:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при получении пользователя' 
    })
  }
})
