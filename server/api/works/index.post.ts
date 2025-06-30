// server/api/works/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { works } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.customerAmount || !body.workerAmount || !body.contractorId || !body.contractorType || !body.objectId) {
      throw createError({ 
        statusCode: 400,
        message: 'Недостаточно данных для создания работы' 
      })
    }

    // Расчёт прибыли
    const customerAmount = Number(body.customerAmount)
    const workerAmount = Number(body.workerAmount)
    const profit = customerAmount - workerAmount

    // Текущая дата
    const now = new Date()

    // Вставляем новую работу
    await db.insert(works).values({
      customerAmount: body.customerAmount,
      workerAmount: body.workerAmount,
      profit: profit.toFixed(2),
      comment: body.comment || '',
      contractorId: body.contractorId,
      contractorType: body.contractorType,
      workTypes: body.workTypes || 'Прочее',
      foremanId: body.foremanId || null,
      accepted: false,
      rejectedReason: null,
      foremanProfit: '0.00',
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
