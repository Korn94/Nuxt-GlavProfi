// server/api/expenses/stats.get.ts

import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { expenses } from '../../db/schema'
import { sql, sum, and, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const startDate = query.startDate ? new Date(query.startDate as string) : null
  const endDate = query.endDate ? new Date(query.endDate as string) : null

  try {
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

    // Преобразуем BigInt в число и возвращаем объект
    return result.map(r => ({
      expenseType: r.expenseType,
      total: Number(r.total || 0)
    }))
  } catch (error) {
    console.error('Ошибка получения статистики по расходам:', error)
    throw new Error('Не удалось получить статистику расходов')
  }
})