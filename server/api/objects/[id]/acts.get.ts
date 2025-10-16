// server/api/objects/[id]/acts.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectActs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const acts = await db
      .select()
      .from(objectActs)
      .where(eq(objectActs.objectId, id))
      .orderBy(objectActs.order)

    return acts.map(a => ({
      ...a,
      amount: typeof a.amount === 'string' ? parseFloat(a.amount) : a.amount
    }))
  } catch (error) {
    console.error('Ошибка получения актов:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
