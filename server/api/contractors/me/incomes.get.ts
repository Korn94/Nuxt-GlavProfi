// server/api/contractors/me/incomes.get.ts
/**
 * Назначение: Получение истории «приходов» (оплаченных работ) ТЕКУЩЕГО
 * пользователя-контрагента (только «свои» данные).
 *
 * id/type берутся из авторизованного пользователя, а не из URL —
 * подставить чужого контрагента невозможно.
 *
 * @returns { Array<{ id, type: 'income', title, amount: number, date, object?, objectName?, comment, paymentDate?, accepted, workType }> }
 */
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { works, objects } from '../../../db/schema'
import { and, eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = (event.context as any).user

  if (!user || !user.id) {
    throw createError({ statusCode: 401, message: 'Пользователь не авторизован' })
  }

  const contractorType = user.contractorType as 'master' | 'worker' | undefined
  const id = Number(user.contractorId || 0)

  if (!contractorType || !id) {
    throw createError({ statusCode: 404, message: 'Контрагент не найден' })
  }

  // Поддерживаем только master/worker для таблицы works
  if (!['master', 'worker'].includes(contractorType)) {
    return []
  }

  // ✅ Добавляем JOIN с objects для получения имени объекта
  const list = await db
    .select({
      id: works.id,
      workTypes: works.workTypes,
      workerAmount: works.workerAmount,
      operationDate: works.operationDate,
      objectId: works.objectId,
      objectName: objects.name,
      comment: works.comment,
      paymentDate: works.paymentDate,
      accepted: works.accepted
    })
    .from(works)
    .leftJoin(objects, eq(works.objectId, objects.id))
    .where(
      and(
        eq(works.contractorType, contractorType),
        eq(works.contractorId, id),
        eq(works.paid, true) // Только оплаченные работы
      )
    )
    .orderBy(desc(works.operationDate))

  return list.map(w => ({
    id: w.id,
    type: 'income' as const,
    title: `${w.workTypes}`,
    amount: parseFloat(String(w.workerAmount)),
    date: w.operationDate instanceof Date ? w.operationDate.toISOString() : w.operationDate,
    object: w.objectId,
    objectName: w.objectName, // ✅ Добавляем имя объекта
    comment: w.comment,
    paymentDate: w.paymentDate instanceof Date ? w.paymentDate.toISOString() : w.paymentDate,
    accepted: w.accepted,
    workType: w.workTypes
  }))
})
