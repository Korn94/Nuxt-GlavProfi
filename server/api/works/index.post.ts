// server/api/works/index.post.ts
/**
 * Назначение: Создание новой работы/задания
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @body { workerAmount: number, contractorId: number, contractorType: string, objectId: number, comment?, workTypes?, workSource?, foremanId?, paid?, paymentDate?, operationDate? }
 * @returns { Work } — созданная работа (с авто-генерацией ID и полей)
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { works } from '../../db/schema'
import { logDailyWork } from '../../utils/workDailyLog'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const body = await readBody(event)
  
  if (!body.workerAmount || !body.contractorId || !body.contractorType || !body.objectId) {
    throw createError({ statusCode: 400, message: 'Недостаточно данных для создания работы' })
  }

  const now = new Date()

  const [newWork] = await db.insert(works).values({
    workerAmount: body.workerAmount,
    comment: body.comment || '',
    contractorId: body.contractorId,
    contractorType: body.contractorType,
    workTypes: body.workTypes || 'Прочее',
    workSource: body.workSource || 'volume',
    foremanId: body.foremanId || null,
    accepted: false,
    rejectedReason: null,
    paid: body.paid || false,
    paymentDate: body.paymentDate || null,
    operationDate: body.operationDate ? new Date(body.operationDate) : now,
    objectId: body.objectId
  }).$returningId()

  // 📝 Журнал изменений подневки: фиксируем создание (только для подневки)
  if (newWork?.id) {
    await logDailyWork(event, 'created', {
      id: newWork.id,
      workSource: body.workSource || 'volume',
      contractorType: body.contractorType,
      contractorId: body.contractorId,
      objectId: body.objectId,
      operationDate: body.operationDate ? new Date(body.operationDate) : now,
      workerAmount: body.workerAmount
    })
  }

  return newWork
})
