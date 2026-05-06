// server/api/objects/[id]/budget.post.ts
/**
 * Назначение: Создание новой позиции сметы объекта
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @body { name: string, amount: number, comment?, order?: number, workProgress?: string, actStatus?: string }
 * @returns { BudgetItem } — созданная позиция (с авто-генерацией ID)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, order = 0, workProgress = 'queued', actStatus = 'none' } = body

  if (!name || amount == null) {
    throw createError({ statusCode: 400, message: 'Название и сумма обязательны' })
  }

  const [newItem] = await db.insert(objectBudget).values({
    objectId: id,
    name,
    amount: String(amount),
    comment,
    order,
    workProgress,
    actStatus
  }).$returningId()

  return newItem
})
