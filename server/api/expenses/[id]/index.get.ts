// server/api/expenses/[id]/index.get.ts
/**
 * Назначение: Получение данных конкретного расхода с информацией о контрагенте и объекте
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID расхода (из пути)
 * @returns { Expense & { amount: number, contractorName?: string, objectName?: string } }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses, masters, workers, foremans, offices, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  const [result] = await db
    .select({
      expense: expenses,
      master: masters,
      worker: workers,
      foreman: foremans,
      office: offices,
      object: objects
    })
    .from(expenses)
    .leftJoin(masters, eq(expenses.contractorId, masters.id))
    .leftJoin(workers, eq(expenses.contractorId, workers.id))
    .leftJoin(foremans, eq(expenses.contractorId, foremans.id))
    .leftJoin(offices, eq(expenses.contractorId, offices.id))
    .leftJoin(objects, eq(expenses.objectId, objects.id))
    .where(eq(expenses.id, parseInt(id)))

  if (!result?.expense) throw createError({ statusCode: 404, message: 'Расход не найден' })

  const contractorName = 
    result.expense.contractorType === 'master' ? result.master?.name :
    result.expense.contractorType === 'worker' ? result.worker?.name :
    result.expense.contractorType === 'foreman' ? result.foreman?.name :
    result.expense.contractorType === 'office' ? result.office?.name :
    null

  return {
    ...result.expense,
    amount: Number(result.expense.amount),
    contractorName,
    objectName: result.object?.name || null
  }
})
