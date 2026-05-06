// server/api/works/daily-work/bulk.post.ts
/**
 * Назначение: Массовое создание подённых работ (одним запросом на несколько дат/объектов)
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @body { workerId: number, contractorType: 'worker'|'master', dates: string[], assignments: Array<{ objectId: number, amount: number }> }
 * @returns { success: boolean, count: number, ids: number[] }
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'

export interface BulkWorkPayload {
  workerId: number
  contractorType: 'worker' | 'master'
  assignments: Array<{ objectId: number; amount: string | number }>
  dates: string[]
}

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const body = await readBody<BulkWorkPayload>(event)

  if (!body.workerId || !body.contractorType || !Array.isArray(body.dates) || !Array.isArray(body.assignments)) {
    throw createError({ statusCode: 400, message: 'Недостаточно данных' })
  }

  if (body.dates.length === 0 || body.assignments.length === 0) {
    throw createError({ statusCode: 400, message: 'Даты и назначения не могут быть пустыми' })
  }

  const recordsToInsert: typeof works.$inferInsert[] = []

  for (const date of body.dates) {
    for (const assignment of body.assignments) {
      recordsToInsert.push({
        workerAmount: assignment.amount.toString(),
        comment: '',
        contractorId: body.workerId,
        contractorType: body.contractorType,
        workTypes: 'Прочее',
        workSource: 'daily',
        foremanId: null,
        accepted: false,
        rejectedReason: null,
        paid: false,
        paymentDate: null,
        operationDate: new Date(date),
        objectId: assignment.objectId
      })
    }
  }

  const result = await db.insert(works).values(recordsToInsert).$returningId()

  return {
    success: true,
    count: result.length,
    ids: result.map(r => r.id)
  }
})
