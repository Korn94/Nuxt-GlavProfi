// server/api/contractors/me/expenses.get.ts
/**
 * Назначение: Получение истории расходов, связанных с ТЕКУЩИМ
 * пользователем-контрагентом (только «свои» данные).
 *
 * id/type берутся из авторизованного пользователя, а не из URL —
 * подставить чужого контрагента невозможно.
 *
 * @returns { Array<{ id, type: 'expense', title, amount: number, date, object?, objectName?, comment, paymentDate? }> }
 */
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { expenses, objects } from '../../../db/schema'
import { and, eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = (event.context as any).user

  if (!user || !user.id) {
    throw createError({ statusCode: 401, message: 'Пользователь не авторизован' })
  }

  const contractorType = user.contractorType as 'master' | 'worker' | 'foreman' | undefined
  const id = Number(user.contractorId || 0)

  if (!contractorType || !id) {
    throw createError({ statusCode: 404, message: 'Контрагент не найден' })
  }

  // ✅ Добавляем JOIN с objects для получения имени объекта
  const list = await db
    .select({
      id: expenses.id,
      expenseType: expenses.expenseType,
      amount: expenses.amount,
      operationDate: expenses.operationDate,
      objectId: expenses.objectId,
      objectName: objects.name,
      comment: expenses.comment,
      paymentDate: expenses.paymentDate
    })
    .from(expenses)
    .leftJoin(objects, eq(expenses.objectId, objects.id))
    .where(
      and(
        eq(expenses.contractorType, contractorType),
        eq(expenses.contractorId, id)
      )
    )
    .orderBy(desc(expenses.operationDate))

  return list.map(e => ({
    id: e.id,
    type: 'expense' as const,
    title: e.expenseType || 'Расход',
    amount: parseFloat(String(e.amount)),
    date: e.operationDate instanceof Date ? e.operationDate.toISOString() : e.operationDate,
    object: e.objectId,
    objectName: e.objectName, // ✅ Добавляем имя объекта
    comment: e.comment,
    paymentDate: e.paymentDate instanceof Date ? e.paymentDate.toISOString() : e.paymentDate
  }))
})
