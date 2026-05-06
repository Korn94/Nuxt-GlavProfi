// server/api/expenses/stats.get.ts
/**
 * Назначение: Получение статистики расходов по типам (с группировкой и суммированием)
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @query { startDate?: string, endDate?: string }
 * @returns { Array<{ expenseType: string, total: number }> } — сумма расходов по каждому типу
 */

import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { expenses } from '../../db/schema'
import { sql, sum, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const query = getQuery(event)
  const startDate = query.startDate ? new Date(query.startDate as string) : null
  const endDate = query.endDate ? new Date(query.endDate as string) : null

  const dateFilter = []
  if (startDate) dateFilter.push(gte(expenses.operationDate, startDate))
  if (endDate) dateFilter.push(lte(expenses.operationDate, endDate))

  const result = await db
    .select({
      expenseType: expenses.expenseType,
      total: sum(expenses.amount).as('total')
    })
    .from(expenses)
    .where(and(...dateFilter))
    .groupBy(expenses.expenseType)

  return result.map(r => ({
    expenseType: r.expenseType,
    total: Number(r.total || 0)
  }))
})
