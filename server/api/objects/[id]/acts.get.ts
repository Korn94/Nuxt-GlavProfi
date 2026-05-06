// server/api/objects/[id]/acts.get.ts
/**
 * Назначение: Получение списка актов объекта
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { Array<Act & { amount: number }> } — массив актов (с amount как number), отсортированных по `order`
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectActs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const acts = await db
    .select()
    .from(objectActs)
    .where(eq(objectActs.objectId, id))
    .orderBy(objectActs.order)

  return acts.map(a => ({
    ...a,
    amount: typeof a.amount === 'string' ? parseFloat(a.amount) : a.amount
  }))
})
