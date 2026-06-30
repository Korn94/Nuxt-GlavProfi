// server/api/contractors/[type]/[id]/expenses.get.ts
/**
 * Назначение: Получение истории расходов, связанных с контрагентом
 * ⚠️ Требует право `canViewContractors` (проверяется в мидлваре)
 * 
 * @param {string} type — тип контрагента: 'master'|'worker'|'foreman'|'office' (из пути)
 * @param {string} id — ID контрагента (из пути)
 * @returns { Array<{ id, type: 'expense', title, amount: number, date, object?, objectName?, comment, paymentDate? }> }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { expenses, objects } from '../../../../db/schema'
import { and, eq, desc } from 'drizzle-orm'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
  }
  if (!id || id <= 0) {
    throw createError({ statusCode: 400, message: 'Неверный ID' })
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
        eq(expenses.contractorType, type),
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
