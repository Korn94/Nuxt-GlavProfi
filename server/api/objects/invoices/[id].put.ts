// server/api/objects/invoices/[id].put.ts
/**
 * Назначение: Обновление данных счёта объекта (статус, сумма, комментарий)
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID счёта (из пути)
 * @body { name?, amount?, comment?, status?, subtype? }
 * @returns { Invoice & { amount: number } } — обновлённый счёт (с amount как number)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

const VALID_STATUSES = ['prepared', 'sent', 'paid'] as const
const VALID_SUBTYPES = ['advance', 'intermediate', 'final', 'additional'] as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const invoiceId = Number(getRouterParam(event, 'id'))
  if (isNaN(invoiceId)) throw createError({ statusCode: 400, message: 'Неверный ID счёта' })

  const body = await readBody(event)
  const { name, amount, comment, status, subtype } = body

  const updateData: Record<string, any> = {}
  let hasChanges = false

  if (name !== undefined && name !== null) { updateData.name = name; hasChanges = true }

  if (amount !== undefined && amount !== null) {
    const parsedAmount = parseFloat(String(amount))
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      throw createError({ statusCode: 400, message: 'Сумма должна быть положительным числом' })
    }
    updateData.amount = parsedAmount.toFixed(2)
    hasChanges = true
  }

  if (comment !== undefined) { updateData.comment = comment === '' ? null : comment; hasChanges = true }

  if (status !== undefined && VALID_STATUSES.includes(status as any)) {
    updateData.status = status
    updateData.statusDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
    hasChanges = true
  }

  if (subtype !== undefined) {
    if (!VALID_SUBTYPES.includes(subtype as any)) {
      throw createError({ statusCode: 400, message: 'Недопустимый подтип счёта' })
    }
    updateData.subtype = subtype
    hasChanges = true
  }

  if (!hasChanges) throw createError({ statusCode: 400, message: 'Нет данных для обновления' })

  await db.update(objectInvoices).set(updateData).where(eq(objectInvoices.id, invoiceId))

  const [updated] = await db.select().from(objectInvoices).where(eq(objectInvoices.id, invoiceId))
  if (!updated) throw createError({ statusCode: 404, message: 'Счёт не найден' })

  return { ...updated, amount: parseFloat(updated.amount) }
})
