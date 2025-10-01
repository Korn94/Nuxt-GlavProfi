// server/api/objects/[id]/budget.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const items = await db
      .select()
      .from(objectBudget)
      .where(eq(objectBudget.objectId, id))
      .orderBy(objectBudget.order)

    return items
  } catch (error) {
    console.error('Ошибка получения сметы:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
