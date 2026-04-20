// server/api/works/daily-work/daily-assignments.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../../db'
import { works, objects } from '../../../db/schema'
import { and, eq, gte, lte } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // console.log('[API] Загрузка назначений подневки...')
  const query = getQuery(event)

  const workerId = Number(query.workerId)
  const contractorType = query.contractorType as 'worker' | 'master'
  const from = query.from as string
  const to = query.to as string

  if (!workerId || !['worker', 'master'].includes(contractorType) || !from || !to) {
    throw createError({
      statusCode: 400,
      message: 'Отсутствуют обязательные параметры: workerId, contractorType, from, to'
    })
  }

  try {
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
          gte(works.operationDate, new Date(from)),
          lte(works.operationDate, new Date(to + 'T23:59:59'))
        )
      )
      .orderBy(works.operationDate)

    // console.log(`[API] Найдено ${result.length} записей подневки`)

    return result.map(r => ({
      id: r.id,
      workerId: r.workerId,
      contractorType: r.contractorType as 'worker' | 'master',
      date: r.operationDate ? r.operationDate.toISOString().split('T')[0] : '',
      objectId: r.objectId,
      objectName: r.objectName || 'Неизвестный объект',
      amount: Number(r.amount) || 0,
      percentage: 100, // Точный процент рассчитывается на фронте при открытии модалки
      workSource: r.workSource as 'daily' | 'volume'
    }))
  } catch (error) {
    console.error('[API] Ошибка загрузки назначений:', error)
    throw createError({
      statusCode: 500,
      message: 'Не удалось загрузить историю подневки'
    })
  }
})
