// server/api/balance.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { comings, expenses, materials, works } from '../../db/schema'
import { sql, eq } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    // Общая сумма приходов
    const totalComings = await db.select({
      sum: sql<number>`COALESCE(SUM(${comings.amount}), 0)`
    }).from(comings)

    // Общая сумма расходов
    const totalExpenses = await db.select({
      sum: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`
    }).from(expenses)

    // Сумма по материалам (входящие и исходящие)
    const materialTotals = await db.select({
      incoming: sql<number>`COALESCE(SUM(CASE WHEN ${materials.type} = 'incoming' THEN ${materials.amount} ELSE 0 END), 0)`,
      outgoing: sql<number>`COALESCE(SUM(CASE WHEN ${materials.type} = 'outgoing' THEN ${materials.amount} ELSE 0 END), 0)`
    }).from(materials)

    // Сумма работ, ожидающих оплату
    const pendingWorks = await db.select({
      sum: sql<number>`COALESCE(SUM(${works.workerAmount}), 0)`
    }).from(works).where(eq(works.paid, false))

    return {
      totalComings: Number(totalComings[0].sum),
      totalExpenses: Number(totalExpenses[0].sum),
      materials: {
        balance: Number(materialTotals[0].incoming) - Number(materialTotals[0].outgoing),
        incoming: Number(materialTotals[0].incoming),
        outgoing: Number(materialTotals[0].outgoing)
      },
      pendingWorks: Number(pendingWorks[0].sum)
    }
  } catch (error) {
    console.error('Ошибка получения баланса:', error)
    throw new Error('Не удалось получить данные о балансе')
  }
})
