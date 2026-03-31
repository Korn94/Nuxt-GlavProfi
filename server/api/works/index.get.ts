// server/api/works/index.get.ts
import { defineEventHandler } from 'h3'
import { db } from '../../db'
import { works } from '../../db/schema'
import { and, eq } from 'drizzle-orm'

// server/api/works/index.get.ts
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
    return [] // Возвращаем пустой массив для неподдерживаемых типов
  }

  let result = []
  if (
    contractorTypeParam &&
    contractorIdParam
  ) {
    const contractorType = contractorTypeParam as 'master' | 'worker'
    const contractorId = parseInt(contractorIdParam)
    result = await db.select().from(works).where(
      and(
        eq(works.contractorType, contractorType),
        eq(works.contractorId, contractorId)
      )
    )
  } else {
    result = await db.select().from(works)
  }
  return result
})
