// server/api/works/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { works, objects } from '../../db/schema' // ✅ Импортируем таблицу objects
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = event.node.req?.url ? new URL(event.node.req.url, 'http://localhost') : null
  const contractorTypeParam = query?.searchParams.get('contractorType')
  const contractorIdParam = query?.searchParams.get('contractorId')

  // ✅ Валидация типа контрагента
  const allowedTypes = ['master', 'worker'] as const
  if (
    contractorTypeParam && 
    !allowedTypes.includes(contractorTypeParam as typeof allowedTypes[number])
  ) {
    return []
  }

  // ✅ Формируем запрос с выборкой нужных полей + JOIN с objects
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
    objectName: objects.name, // ✅ Добавляем название объекта
    createdAt: works.createdAt,
    updatedAt: works.updatedAt,
  }

  let result = []
  if (contractorTypeParam && contractorIdParam) {
    const contractorType = contractorTypeParam as 'master' | 'worker'
    const contractorId = parseInt(contractorIdParam)
    
    result = await db
      .select(selectFields)
      .from(works)
      .leftJoin(objects, eq(works.objectId, objects.id)) // ✅ JOIN с objects
      .where(
        and(
          eq(works.contractorType, contractorType),
          eq(works.contractorId, contractorId)
        )
      )
  } else {
    // Для случая без фильтров тоже добавляем JOIN
    result = await db
      .select(selectFields)
      .from(works)
      .leftJoin(objects, eq(works.objectId, objects.id))
  }
  
  return result
})
