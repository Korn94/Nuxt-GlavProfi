// server/api/contractors/[type]/[id]/incomes.get.ts
/**
 * Назначение: Получение истории «приходов» (оплаченных работ) для контрагента
 * ⚠️ Требует право `canViewContractors` (проверяется в мидлваре)
 * 
 * @param {string} type — тип контрагента: 'master'|'worker' (из пути)
 * @param {string} id — ID контрагента (из пути)
 * @returns { Array<{ id, type: 'income', title, amount: number, date, object?, comment, paymentDate?, accepted, workType }> }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { works } from '../../../../db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
  }
  if (!id || id <= 0) {
    throw createError({ statusCode: 400, message: 'Неверный ID' })
  }

  // Поддерживаем только master/worker для таблицы works
  if (!['master', 'worker'].includes(type)) {
    return []
  }

  const contractorType = type as 'master' | 'worker'

  const list = await db
    .select()
    .from(works)
    .where(
      and(
        eq(works.contractorType, contractorType),
        eq(works.contractorId, id),
        eq(works.paid, true) // Только оплаченные работы
      )
    )
    .orderBy(desc(works.operationDate))

  return list.map(w => ({
    id: w.id,
    type: 'income' as const,
    title: `${w.workTypes}`,
    amount: parseFloat(String(w.workerAmount)),
    date: w.operationDate instanceof Date ? w.operationDate.toISOString() : w.operationDate,
    object: w.objectId,
    comment: w.comment,
    paymentDate: w.paymentDate instanceof Date ? w.paymentDate.toISOString() : w.paymentDate,
    accepted: w.accepted,
    workType: w.workTypes
  }))
})
