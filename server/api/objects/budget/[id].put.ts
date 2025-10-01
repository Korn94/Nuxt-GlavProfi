// server/api/objects/budget/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const itemId = Number(getRouterParam(event, 'id'))
  if (isNaN(itemId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, order } = body

  const updateData: any = {}
  if (name) updateData.name = name
  if (amount !== undefined) updateData.amount = String(amount)
  if (comment !== undefined) updateData.comment = comment
  if (order !== undefined) updateData.order = order
  updateData.updatedAt = new Date()

  if (Object.keys(updateData).length <= 1) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  try {
    // Сначала UPDATE
    await db
      .update(objectBudget)
      .set(updateData)
      .where(eq(objectBudget.id, itemId))

    // Потом SELECT, чтобы вернуть обновлённую запись
    const [updated] = await db
      .select()
      .from(objectBudget)
      .where(eq(objectBudget.id, itemId))

    if (!updated) throw createError({ statusCode: 404, message: 'Позиция не найдена' })

    return updated
  } catch (error) {
    console.error('Ошибка обновления сметы:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
