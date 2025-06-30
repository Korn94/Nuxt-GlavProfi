// server/api/expenses/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id)))
    if (!expense) throw createError({ statusCode: 404, message: 'Расход не найден' })

    return expense
  } catch (error) {
    console.error('Ошибка получения расхода:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при получении расхода' 
    })
  }
})
