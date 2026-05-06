// server/api/comings/index.get.ts
/**
 * Назначение: Получение списка приходов (поступлений средств) с фильтрацией по дате
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @query { startDate?: string, endDate?: string }
 * @returns { Coming[] } — массив записей приходов, отсортированных по дате (от новых к старым)
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../db'
import { comings } from '../../db/schema'
import { and, gte, lte, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const query = getQuery(event)
  const filters = []

  // Фильтрация по дате
  if (query.startDate) {
    const startDate = new Date(query.startDate as string)
    if (isNaN(startDate.getTime())) throw createError({ statusCode: 400, message: 'Неверный формат startDate' })
    filters.push(gte(comings.operationDate, startDate))
  }
  if (query.endDate) {
    const endDate = new Date(query.endDate as string)
    if (isNaN(endDate.getTime())) throw createError({ statusCode: 400, message: 'Неверный формат endDate' })
    filters.push(lte(comings.operationDate, endDate))
  }

  return await db.select()
    .from(comings)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(comings.operationDate))
})
