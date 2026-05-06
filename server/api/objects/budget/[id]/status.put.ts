// server/api/objects/budget/[id]/status.put.ts
/**
 * Назначение: Обновление статусов позиции сметы (выполнение работ + статус акта)
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID позиции сметы (из пути)
 * @body { workProgress?, actStatus? }
 * @returns { BudgetItem } — обновлённая запись
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { objectBudget } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const itemId = Number(getRouterParam(event, 'id'))
  if (isNaN(itemId)) throw createError({ statusCode: 400, message: 'Неверный ID позиции' })

  const body = await readBody(event)
  const { workProgress, actStatus } = body

  const updateData: Record<string, any> = {}
  if (workProgress !== undefined) updateData.workProgress = workProgress
  if (actStatus !== undefined) updateData.actStatus = actStatus

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, message: 'Не указаны статусы для обновления' })
  }

  await db.update(objectBudget).set({ ...updateData, updatedAt: new Date() }).where(eq(objectBudget.id, itemId))

  const [updated] = await db.select().from(objectBudget).where(eq(objectBudget.id, itemId))
  if (!updated) throw createError({ statusCode: 404, message: 'Позиция сметы не найдена' })

  return updated
})
