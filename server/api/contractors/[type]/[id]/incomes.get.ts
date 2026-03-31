// server/api/contractors/[type]/[id]/incomes.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { works } from '../../../../db/schema'
import { and, eq, desc } from 'drizzle-orm'
import type { ContractorType } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

/**
 * GET /api/contractors/master/123/incomes
 * Возвращает историю "приходов" для контрагента
 * (оплаченные работы контрагента → − к балансу контрагента)
 * 
 * ⚠️ Важно: берём только оплаченные работы (paid = true)
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  // Валидация
  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid contractor type' })
  }
  if (!id || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  // Поддерживаем только master/worker для works
  if (!['master', 'worker'].includes(type)) {
    return [] // foreman/office не имеют записей в works
  }

  try {
    const list = await db
      .select()
      .from(works)
      .where(
        and(
          eq(works.contractorType, type),
          eq(works.contractorId, id),
          eq(works.paid, true) // Только оплаченные работы
        )
      )
      .orderBy(desc(works.operationDate))

    // Маппинг в формат, совместимый с expenses
    return list.map(w => ({
      id: w.id,
      type: 'income' as const,
      title: `Работа: ${w.workTypes}`,
      amount: parseFloat(String(w.workerAmount)),
      date: w.operationDate instanceof Date 
        ? w.operationDate.toISOString() 
        : w.operationDate,
      object: w.objectId,
      comment: w.comment,
      paymentDate: w.paymentDate instanceof Date 
        ? w.paymentDate.toISOString() 
        : w.paymentDate,
      accepted: w.accepted,
      workType: w.workTypes
    }))
  } catch (error: any) {
    console.error('[API] Error fetching contractor incomes:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch incomes history'
    })
  }
})
