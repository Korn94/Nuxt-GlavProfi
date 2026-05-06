// server/api/objects/[id]/invoices.get.ts
/**
 * Назначение: Получение списка счетов объекта
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { Array<Invoice & { amount: number }> } — массив счетов (с amount как number)
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const invoices = await db
    .select()
    .from(objectInvoices)
    .where(eq(objectInvoices.objectId, id))
    .orderBy(objectInvoices.order)

  return invoices.map(i => ({
    ...i,
    amount: typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount
  }))
})
