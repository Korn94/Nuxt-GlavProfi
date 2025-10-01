// server/api/objects/[id]/invoices.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const invoices = await db
      .select()
      .from(objectInvoices)
      .where(eq(objectInvoices.objectId, id))
      .orderBy(objectInvoices.order)

    return invoices.map(i => ({
      ...i,
      amount: typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
    }))
  } catch (error) {
    console.error('Ошибка получения счетов:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
