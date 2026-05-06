// server/api/objects/[id]/budget.get.ts
/**
 * Назначение: Получение сметы объекта (список позиций)
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { BudgetItem[] } — массив позиций сметы, отсортированных по `order`
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  return await db
    .select()
    .from(objectBudget)
    .where(eq(objectBudget.objectId, id))
    .orderBy(objectBudget.order)
})
