// server/api/objects/[id]/invoices.post.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, subtype, order = 0 } = body

  if (!name || amount == null) {
    throw createError({ statusCode: 400, message: 'Название и сумма обязательны' })
  }

  try {
    // Вставляем запись
    await db.insert(objectInvoices).values({
      objectId: id,
      name,
      amount: String(amount),
      comment,
      subtype,
      order,
      status: 'prepared'
    })

    // Получаем полную запись (аналогично objects/index.post.ts)
    const [newInvoice] = await db.select().from(objectInvoices)
      .where(eq(objectInvoices.objectId, id))
      .orderBy(desc(objectInvoices.id))
      .limit(1)

    if (!newInvoice) {
      throw createError({ statusCode: 500, message: 'Не удалось создать счёт' })
    }

    // Приводим amount к числу при ответе
    return {
      ...newInvoice,
      amount: parseFloat(newInvoice.amount)
    }
  } catch (error) {
    console.error('Ошибка создания счёта:', error)
    throw createError({ statusCode: 500, message: 'Не удалось создать счёт' })
  }
})