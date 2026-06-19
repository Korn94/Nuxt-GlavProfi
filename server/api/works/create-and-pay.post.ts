// server/api/works/create-and-pay.post.ts
/**
 * Назначение: Создание работы + мгновенная оплата (транзакция)
 * ⚠️ Требует право `canViewSalary` (проверяется в мидлваре)
 *
 * Логика:
 * 1. Создаём работу с paid: true, accepted: true
 * 2. Создаём расход типа "Работа" + атомарно УВЕЛИЧИВАЕМ баланс
 * 3. Атомарно ВЫЧИТАЕМ workerAmount из баланса (оплата работы)
 * 4. Атомарно обновляем агрегаты объекта
 *
 * Итог: баланс контрагента не меняется (+amount - amount = 0)
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

    // 2. Создаём расход типа "Работа"
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

    // ✅ ИСПРАВЛЕНО: Два атомарных обновления баланса в одной транзакции
    //
    // Формула баланса:
    //   balance = Σ(expenses типа "Работа") − Σ(works с paid=true)
    //
    // При create-and-pay:
    //   + Расход увеличивает баланс на amount
    //   − Оплаченная работа уменьшает баланс на workerAmount
    //   = Итог: 0 (баланс не меняется)
    if (body.contractorType === 'master' || body.contractorType === 'worker') {
      const ContractorModel = body.contractorType === 'master' ? masters : workers

      // ✅ УВЕЛИЧИВАЕМ баланс (создание расхода типа "Работа")
      await tx.update(ContractorModel)
        .set({ balance: sql`balance + ${body.workerAmount}` })
        .where(eq(ContractorModel.id, body.contractorId))

      // ✅ УМЕНЬШАЕМ баланс (оплата работы с paid=true)
      await tx.update(ContractorModel)
        .set({ balance: sql`balance - ${body.workerAmount}` })
        .where(eq(ContractorModel.id, body.contractorId))
    }

    // 4. Атомарное обновление агрегатов объекта через SQL
    await tx.update(objects)
      .set({
        totalWorks: sql`total_works + ${body.workerAmount}`,
        totalBalance: sql`(total_income) - (total_works + ${body.workerAmount})`
      })
      .where(eq(objects.id, body.objectId))

    return newWork
  })
})
