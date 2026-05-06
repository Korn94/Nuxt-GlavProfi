// server/api/objects/invoices/[id].delete.ts
/**
 * Назначение: Удаление счёта объекта
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID счёта (из пути)
 * @returns { message: string, id: number }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const [deleted] = await db.select().from(objectInvoices).where(eq(objectInvoices.id, id))
  if (!deleted) throw createError({ statusCode: 404, message: 'Счёт не найден' })

  await db.delete(objectInvoices).where(eq(objectInvoices.id, id))

  return { message: 'Счёт удалён', id }
})
