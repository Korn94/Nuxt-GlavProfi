// server/api/works/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { works } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.workerAmount || !body.contractorId || !body.contractorType || !body.objectId) {
      throw createError({ 
        statusCode: 400,
        message: 'Недостаточно данных для создания работы' 
      })
    }

    // Текущая дата
    const now = new Date()

    // Вставляем новую работу
    await db.insert(works).values({
      workerAmount: body.workerAmount,
      comment: body.comment || '',
      contractorId: body.contractorId,
      contractorType: body.contractorType,
      workTypes: body.workTypes || 'Прочее',
      foremanId: body.foremanId || null,
      accepted: false,
      rejectedReason: null,
      paid: body.paid || false,
      paymentDate: body.paymentDate || null,
      operationDate: now,
      objectId: body.objectId
    })

    // Получаем созданную запись
    const [newWork] = await db.select().from(works).orderBy(works.id).limit(1)
    return newWork
  } catch (error) {
    console.error('Ошибка создания работы:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при создании работы' 
    })
  }
})
