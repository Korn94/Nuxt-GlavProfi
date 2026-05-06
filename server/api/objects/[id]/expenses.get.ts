// server/api/objects/[id]/expenses.get.ts
/**
 * Назначение: Получение списка расходов объекта
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { Expense[] } — массив записей расходов
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  return await db.select().from(expenses).where(eq(expenses.objectId, parseInt(id)))
})
