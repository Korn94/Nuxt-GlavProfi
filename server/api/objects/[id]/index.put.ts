// server/api/objects/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  try {
    const body = await readBody(event)

    const updates: any = {}
    if (body.name) updates.name = body.name
    if (body.status) updates.status = body.status
    if (body.totalIncome !== undefined) updates.totalIncome = body.totalIncome
    if (body.totalExpenses !== undefined) updates.totalExpenses = body.totalExpenses
    if (body.profit !== undefined) updates.profit = body.profit
    if (body.totalBalance !== undefined) updates.totalBalance = body.totalBalance
    if (body.foremanId !== undefined) updates.foremanId = body.foremanId
    if (body.updatedAt) updates.updatedAt = body.updatedAt

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    await db.update(objects).set(updates).where(eq(objects.id, parseInt(id)))

    const [updated] = await db.select().from(objects).where(eq(objects.id, parseInt(id)))
    if (!updated) throw createError({ statusCode: 404, message: 'Объект не найден' })

    return updated
  } catch (error) {
    console.error('Ошибка обновления объекта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при обновлении объекта' })
  }
})
