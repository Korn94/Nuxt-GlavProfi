// server/api/works/daily-work/workers-with-daily-rate.get.ts
/**
 * Назначение: Получение списка рабочих/мастеров с подневной оплатой (dailyRate > 0)
 * ⚠️ Требует право `canViewSalary` (проверяется в мидлваре)
 * 
 * @returns { Array<{ id: number, name: string, dailyRate: number, balance: number, contractorType: 'worker'|'master' }> }
 */

import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { workers, masters } from '../../../db/schema'
import { gt, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  // ✅ Авторизация и права уже проверены мидлваром

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

  return [...workersList, ...mastersList].map(w => ({
    ...w,
    dailyRate: Number(w.dailyRate),
    balance: Number(w.balance)
  }))
})
