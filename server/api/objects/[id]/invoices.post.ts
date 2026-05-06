// server/api/objects/[id]/invoices.post.ts
/**
 * Назначение: Создание нового счёта для объекта
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @body { name: string, amount: number, comment?, subtype?, order?: number }
 * @returns { Invoice & { amount: number } } — созданный счёт (с amount как number)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, subtype, order = 0 } = body

  if (!name || amount == null) {
    throw createError({ statusCode: 400, message: 'Название и сумма обязательны' })
  }

  await db.insert(objectInvoices).values({
    objectId: id,
    name,
    amount: String(amount),
    comment,
    subtype,
    order,
    status: 'prepared'
  })

  const [newInvoice] = await db.select().from(objectInvoices)
    .where(eq(objectInvoices.objectId, id))
    .orderBy(desc(objectInvoices.id))
    .limit(1)

  if (!newInvoice) throw createError({ statusCode: 500, message: 'Не удалось создать счёт' })

  return { ...newInvoice, amount: parseFloat(newInvoice.amount) }
})
