// server/api/works/create-and-pay.post.ts
/**
 * Назначение: Создание работы + мгновенная оплата (транзакция)
 * ⚠️ Требует право `canViewSalary` (проверяется в мидлваре)
 * 
 * Логика:
 * 1. Создаём работу с paid: true, accepted: true
 * 2. Создаём расход типа "Работа" (увеличивает баланс контрагента)
 * 3. Атомарно вычитаем workerAmount из баланса (оплата работы)
 * 4. Атомарно обновляем агрегаты объекта
 * 
 * Итог: баланс контрагента не меняется (расход + оплата = 0)
 * 
 * @body { workerAmount: number, contractorId: number, contractorType: string, objectId: number, comment?, workTypes?, workSource?, foremanId?, operationDate? }
 * @returns { Work } — созданная работа
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { works, expenses, objects, masters, workers } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'

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
    //    → увеличивает баланс контрагента на workerAmount
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

    // 3. ✅ НОВОЕ: Атомарно вычитаем workerAmount из баланса (оплата работы)
    //    Итоговый эффект на баланс: +amount (расход) - amount (оплата) = 0
    if (body.contractorType === 'master' || body.contractorType === 'worker') {
      const ContractorModel = body.contractorType === 'master' ? masters : workers
      
      await tx.update(ContractorModel)
        .set({ balance: sql`balance - ${body.workerAmount}` })
        .where(eq(ContractorModel.id, body.contractorId))
    }

    // 4. ✅ Атомарное обновление агрегатов объекта через SQL
    await tx.update(objects)
      .set({
        totalWorks: sql`total_works + ${body.workerAmount}`,
        totalBalance: sql`(total_income) - (total_works + ${body.workerAmount})`
      })
      .where(eq(objects.id, body.objectId))

    return newWork
  })
})
