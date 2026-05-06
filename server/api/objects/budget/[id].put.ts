// server/api/objects/budget/[id].put.ts
/**
 * Назначение: Обновление позиции сметы объекта
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID позиции сметы (из пути)
 * @body { name?, amount?, comment?, order? }
 * @returns { BudgetItem } — обновлённая запись
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const itemId = Number(getRouterParam(event, 'id'))
  if (isNaN(itemId)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, order } = body

  const updateData: Record<string, any> = {}
  if (name) updateData.name = name
  if (amount !== undefined) updateData.amount = String(amount)
  if (comment !== undefined) updateData.comment = comment
  if (order !== undefined) updateData.order = order
  updateData.updatedAt = new Date()

  // Проверяем, что есть что обновить (исключаем только updatedAt)
  const changesCount = Object.keys(updateData).filter(k => k !== 'updatedAt').length
  if (changesCount === 0) throw createError({ statusCode: 400, message: 'Нет данных для обновления' })

  await db.update(objectBudget).set(updateData).where(eq(objectBudget.id, itemId))

  const [updated] = await db.select().from(objectBudget).where(eq(objectBudget.id, itemId))
  if (!updated) throw createError({ statusCode: 404, message: 'Позиция не найдена' })

  return updated
})
