// server/api/works/daily-work/workers-with-daily-rate.get.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { workers, masters } from '../../../db/schema'
import { gt, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    // Загружаем рабочих с dailyRate > 0
    const workersList = await db
      .select({
        id: workers.id,
        name: workers.name,
        dailyRate: workers.dailyRate,
        balance: workers.balance,
        contractorType: sql<'worker'>`'worker'`.as('contractorType')
      })
      .from(workers)
      .where(gt(workers.dailyRate, '0'))

    // Загружаем мастеров с dailyRate > 0
    const mastersList = await db
      .select({
        id: masters.id,
        name: masters.name,
        dailyRate: masters.dailyRate,
        balance: masters.balance,
        contractorType: sql<'master'>`'master'`.as('contractorType')
      })
      .from(masters)
      .where(gt(masters.dailyRate, '0'))

    // Объединяем и возвращаем единый список
    return [...workersList, ...mastersList].map(w => ({
      ...w,
      dailyRate: Number(w.dailyRate),
      balance: Number(w.balance)
    }))
  } catch (error) {
    console.error('[API] Ошибка получения списка рабочих с подневкой:', error)
    throw createError({
      statusCode: 500,
      message: 'Не удалось загрузить список рабочих'
    })
  }
})
