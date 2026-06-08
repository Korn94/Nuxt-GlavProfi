// server/api/works/daily-work/daily-assignments.get.ts
/**
 * Назначение: Получение истории подённых назначений для контрагента за период
 * ⚠️ Требует право `canViewSalary` (проверяется в мидлваре)
 * 
 * @query { workerId: number, contractorType: 'worker'|'master', from: string (YYYY-MM-DD), to: string (YYYY-MM-DD) }
 * @returns { Array<{ id, workerId, contractorType, date, objectId, objectName, amount, percentage, workSource }> }
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../../db'
import { works, objects, workers, masters } from '../../../db/schema'
import { and, eq, gte, lte, isNotNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const workerId = Number(query.workerId)
  const contractorType = query.contractorType as 'worker' | 'master'
  const from = query.from as string
  const to = query.to as string

  if (!workerId || !['worker', 'master'].includes(contractorType) || !from || !to) {
    throw createError({ statusCode: 400, message: 'Отсутствуют обязательные параметры' })
  }

  // ← НОВОЕ: получаем дневную ставку работника
  let dailyRate = 0
  if (contractorType === 'worker') {
    const [worker] = await db.select({ dailyRate: workers.dailyRate }).from(workers).where(eq(workers.id, workerId))
    dailyRate = Number(worker?.dailyRate ?? 0)
  } else {
    const [master] = await db.select({ dailyRate: masters.dailyRate }).from(masters).where(eq(masters.id, workerId))
    dailyRate = Number(master?.dailyRate ?? 0)
  }

  if (dailyRate === 0) {
    return [] // Работник не на подневке
  }

  const result = await db
    .select({
      id: works.id,
      workerId: works.contractorId,
      contractorType: works.contractorType,
      operationDate: works.operationDate,
      objectId: works.objectId,
      objectName: objects.name,
      amount: works.workerAmount,
      workSource: works.workSource
    })
    .from(works)
    .leftJoin(objects, eq(works.objectId, objects.id))
    .where(
      and(
        eq(works.contractorId, workerId),
        eq(works.contractorType, contractorType),
        eq(works.workSource, 'daily'),
        isNotNull(works.operationDate),
        gte(works.operationDate, new Date(from)),
        lte(works.operationDate, new Date(to + 'T23:59:59'))
      )
    )
    .orderBy(works.operationDate)

  function getDateKey(date: Date | null): string {
    if (!date) return ''
    return date.toISOString().split('T')[0] ?? ''
  }

  // Группируем по дате
  const groupedByDate = new Map<string, typeof result>()
  
  for (const r of result) {
    const dateKey = getDateKey(r.operationDate)
    if (!dateKey) continue
    
    if (!groupedByDate.has(dateKey)) {
      groupedByDate.set(dateKey, [])
    }
    const group = groupedByDate.get(dateKey)
    if (group) {
      group.push(r)
    }
  }

  // ← ИЗМЕНЕНО: рассчитываем процент от dailyRate, а не от суммы за день
  return result.map(r => {
    const dateKey = getDateKey(r.operationDate)
    const amount = Number(r.amount ?? 0)
    
    // Процент = (amount / dailyRate) * 100
    const percentage = dailyRate > 0
      ? Math.round((amount / dailyRate) * 100)
      : 100

    return {
      id: r.id,
      workerId: r.workerId,
      contractorType: r.contractorType as 'worker' | 'master',
      date: dateKey,
      objectId: r.objectId,
      objectName: r.objectName || 'Неизвестный объект',
      amount,
      percentage,
      workSource: r.workSource as 'daily' | 'volume'
    }
  })
})
