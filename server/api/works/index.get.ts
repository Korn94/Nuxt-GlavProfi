// server/api/works/index.get.ts
/**
 * Назначение: Получение списка работ с фильтрацией по контрагенту
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @query { contractorType?: 'master'|'worker', contractorId?: number }
 * @returns { WorkWithObject[] } — массив работ с названием объекта (`objectName`)
 */

import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { works, objects } from '../../db/schema'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const query = event.node.req?.url ? new URL(event.node.req.url, 'http://localhost') : null
  const contractorTypeParam = query?.searchParams.get('contractorType')
  const contractorIdParam = query?.searchParams.get('contractorId')

  const allowedTypes = ['master', 'worker'] as const
  if (contractorTypeParam && !allowedTypes.includes(contractorTypeParam as typeof allowedTypes[number])) {
    return []
  }

  const selectFields = {
    id: works.id,
    workerAmount: works.workerAmount,
    comment: works.comment,
    contractorId: works.contractorId,
    contractorType: works.contractorType,
    workTypes: works.workTypes,
    foremanId: works.foremanId,
    accepted: works.accepted,
    acceptedDate: works.acceptedDate,
    rejectedReason: works.rejectedReason,
    paid: works.paid,
    paymentDate: works.paymentDate,
    operationDate: works.operationDate,
    objectId: works.objectId,
    objectName: objects.name,
    createdAt: works.createdAt,
    updatedAt: works.updatedAt,
  }

  if (contractorTypeParam && contractorIdParam) {
    const contractorType = contractorTypeParam as 'master' | 'worker'
    const contractorId = parseInt(contractorIdParam)
    
    return await db
      .select(selectFields)
      .from(works)
      .leftJoin(objects, eq(works.objectId, objects.id))
      .where(and(eq(works.contractorType, contractorType), eq(works.contractorId, contractorId)))
  }

  return await db
    .select(selectFields)
    .from(works)
    .leftJoin(objects, eq(works.objectId, objects.id))
})
