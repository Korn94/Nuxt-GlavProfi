// server/api/balance.get.ts
/**
 * Назначение: Получение сводного финансового баланса по всем таблицам
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @query { startDate?: string, endDate?: string } — опциональный период фильтрации
 * @returns { 
 *   totalComings: number, 
 *   totalExpenses: number, 
 *   materials: { balance: number, incoming: number, outgoing: number }, 
 *   pendingWorks: number 
 * }
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../db'
import { comings, expenses, materials, works } from '../../db/schema'
import { sql, between, and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const query = getQuery(event)
  const startDate = query.startDate ? new Date(query.startDate as string) : null
  const endDate = query.endDate ? new Date(query.endDate as string) : null

  // Хелпер для условия даты
  const dateCondition = (table: any) => 
    startDate && endDate ? between(table.operationDate, startDate, endDate) : undefined

  // 📥 Приходы
  const [totalComingsResult] = await db.select({
    sum: sql<number>`COALESCE(SUM(${comings.amount}), 0)`
  }).from(comings).where(dateCondition(comings))

  // 📤 Расходы
  const [totalExpensesResult] = await db.select({
    sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
  }).from(expenses).where(dateCondition(expenses))

  // 📦 Материалы (входящие/исходящие)
  const [materialTotals] = await db.select({
    incoming: sql<number>`COALESCE(SUM(CASE WHEN ${materials.type} = 'incoming' THEN ${materials.amount} ELSE 0 END), 0)`,
    outgoing: sql<number>`COALESCE(SUM(CASE WHEN ${materials.type} = 'outgoing' THEN ${materials.amount} ELSE 0 END), 0)`
  }).from(materials).where(dateCondition(materials))

  // ⏳ Работы, ожидающие оплаты
  const [pendingWorksResult] = await db.select({
    sum: sql<number>`COALESCE(SUM(${works.workerAmount}), 0)`
  }).from(works).where(and(eq(works.paid, false), dateCondition(works)))

  return {
    totalComings: Number(totalComingsResult?.sum ?? 0),
    totalExpenses: Number(totalExpensesResult?.sum ?? 0),
    materials: {
      balance: Number(materialTotals?.incoming ?? 0) - Number(materialTotals?.outgoing ?? 0),
      incoming: Number(materialTotals?.incoming ?? 0),
      outgoing: Number(materialTotals?.outgoing ?? 0)
    },
    pendingWorks: Number(pendingWorksResult?.sum ?? 0)
  }
})
