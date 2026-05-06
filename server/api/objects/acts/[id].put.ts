// server/api/objects/acts/[id].put.ts
/**
 * Назначение: Обновление данных акта объекта (статус, сумма, комментарий)
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID акта (из пути)
 * @body { name?, amount?, comment?, status? }
 * @returns { Act & { amount: number } } — обновлённый акт (с amount как number)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectActs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

const VALID_STATUSES = ['prepared', 'awaiting', 'signed'] as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const actId = Number(getRouterParam(event, 'id'))
  if (isNaN(actId)) throw createError({ statusCode: 400, message: 'Неверный ID акта' })

  const body = await readBody(event)
  const { name, amount, comment, status } = body

  const updateData: Record<string, any> = {}
  let hasChanges = false

  if (name !== undefined) { updateData.name = name; hasChanges = true }
  if (amount !== undefined) { updateData.amount = String(amount); hasChanges = true }
  if (comment !== undefined) { updateData.comment = comment; hasChanges = true }
  if (status !== undefined && VALID_STATUSES.includes(status as any)) {
    updateData.status = status
    updateData.statusDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
    hasChanges = true
  }

  if (!hasChanges) throw createError({ statusCode: 400, message: 'Нет данных для обновления' })

  await db.update(objectActs).set(updateData).where(eq(objectActs.id, actId))

  const [updated] = await db.select().from(objectActs).where(eq(objectActs.id, actId))
  if (!updated) throw createError({ statusCode: 404, message: 'Акт не найден' })

  return { ...updated, amount: parseFloat(updated.amount) }
})
