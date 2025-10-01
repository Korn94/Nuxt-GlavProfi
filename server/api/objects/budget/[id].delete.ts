// server/api/objects/budget/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const [deleted] = await db
      .select()
      .from(objectBudget)
      .where(eq(objectBudget.id, id))

    if (!deleted) throw createError({ statusCode: 404, message: 'Позиция не найдена' })

    await db.delete(objectBudget).where(eq(objectBudget.id, id))

    return { message: 'Позиция удалена', id }
  } catch (error) {
    console.error('Ошибка удаления позиции сметы:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
