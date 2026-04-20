// server/api/works/daily-work/bulk.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'

export interface BulkWorkPayload {
  workerId: number
  contractorType: 'worker' | 'master'
  assignments: Array<{
    objectId: number
    amount: string | number
  }>
  dates: string[] // ISO date strings: '2024-01-15'
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<BulkWorkPayload>(event)

    // 🔒 Валидация (без изменений)
    if (!body.workerId || !body.contractorType || !Array.isArray(body.dates) || !Array.isArray(body.assignments)) {
      throw createError({
        statusCode: 400,
        message: 'Недостаточно данных: требуются workerId, contractorType, dates[], assignments[]'
      })
    }

    if (body.dates.length === 0 || body.assignments.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Даты и назначения не могут быть пустыми'
      })
    }

    // 📦 Формируем массив записей для вставки
    const now = new Date()
    
    // ✅ Явно типизируем массив, чтобы TS понял структуру
    const recordsToInsert: typeof works.$inferInsert[] = []

    for (const date of body.dates) {
      for (const assignment of body.assignments) {
        recordsToInsert.push({
          workerAmount: assignment.amount.toString(),
          comment: '',
          contractorId: body.workerId,
          contractorType: body.contractorType, // ✅ 'worker' | 'master' — подходит
          workTypes: 'Прочее' as const,        // ✅ as const делает литерал, а не string
          workSource: 'daily' as const,        // ✅ то же самое
          foremanId: null,
          accepted: false,
          rejectedReason: null,
          paid: false,
          paymentDate: null,
          operationDate: new Date(date),
          objectId: assignment.objectId
          // createdAt и updatedAt подставятся автоматически по default в схеме
        })
      }
    }

    // 🚀 Массовая вставка
    const result = await db.insert(works).values(recordsToInsert).$returningId()

    return {
      success: true,
      count: result.length,
      ids: result.map(r => r.id)
    }

  } catch (error: any) {
    console.error('[API bulk] Ошибка массового создания работ:', error)
    
    if (error.statusCode === 400) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при массовом создании работ'
    })
  }
})
