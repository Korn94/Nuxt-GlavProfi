// server/api/works/create-and-pay.post.ts
/**
 * Назначение: Создание работы + мгновенная оплата (транзакция)
 * ⚠️ Требует право `canViewSalary` (проверяется в мидлваре)
 * 
 * @body { workerAmount: number, contractorId: number, contractorType: string, objectId: number, comment?, workTypes?, workSource?, foremanId?, operationDate? }
 * @returns { Work } — созданная работа (с `accepted: true`, `paid: true`)
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { works, expenses, objects } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const body = await readBody(event)
  
  if (!body.workerAmount || !body.contractorId || !body.contractorType || !body.objectId) {
    throw createError({ statusCode: 400, message: 'Недостаточно данных' })
  }

  const operationDate = body.operationDate ? new Date(body.operationDate) : new Date()

  return await db.transaction(async (tx) => {
    const now = new Date()
    
    // 1. Создаём работу как принятую и оплаченную
    const [newWork] = await tx.insert(works).values({
      workerAmount: body.workerAmount,
      comment: body.comment || '',
      contractorId: body.contractorId,
      contractorType: body.contractorType,
      workTypes: body.workTypes || 'Прочее',
      workSource: body.workSource || 'volume',
      foremanId: body.foremanId || null,
      accepted: true,
      acceptedDate: now,
      rejectedReason: null,
      paid: true,
      paymentDate: now,
      operationDate,
      objectId: body.objectId
    }).$returningId()

    if (!newWork) throw new Error('Не удалось создать работу')

    // 2. Создаём расход (долг компании перед контрагентом)
    await tx.insert(expenses).values({
      amount: body.workerAmount.toString(),
      comment: body.comment || '',
      contractorId: body.contractorId,
      contractorType: body.contractorType,
      objectId: body.objectId,
      expenseType: 'Работа',
      paymentDate: now,
      operationDate
    })

    // 3. Обновляем агрегаты объекта
    const [object] = await tx.select().from(objects).where(eq(objects.id, body.objectId))
    if (!object) throw createError({ statusCode: 404, message: 'Объект не найден' })

    const newTotalWorks = Number(object.totalWorks) + Number(body.workerAmount)
    const newTotalBalance = Number(object.totalIncome) - newTotalWorks

    await tx.update(objects)
      .set({
        totalWorks: newTotalWorks.toFixed(2),
        totalBalance: newTotalBalance.toFixed(2)
      })
      .where(eq(objects.id, body.objectId))

    return newWork
  })
})
