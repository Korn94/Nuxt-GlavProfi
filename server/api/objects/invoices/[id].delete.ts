// server/api/objects/invoices/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const [deleted] = await db
      .select()
      .from(objectInvoices)
      .where(eq(objectInvoices.id, id))

    if (!deleted) throw createError({ statusCode: 404, message: 'Счёт не найден' })

    await db.delete(objectInvoices).where(eq(objectInvoices.id, id))

    return { message: 'Счёт удалён', id }
  } catch (error) {
    console.error('Ошибка удаления счёта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
