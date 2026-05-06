// server/api/expenses/index.get.ts
/**
 * Назначение: Получение списка расходов с фильтрацией и данными контрагентов/объектов
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @query { startDate?, endDate?, contractorType?, contractorId? }
 * @returns { Array<Expense & { contractorName: string, objectName?: string }> }
 */

import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../db'
import { expenses, workers, masters, objects, foremans, offices } from '../../db/schema'
import { and, eq, gte, lte, desc } from 'drizzle-orm'

const ALLOWED_TYPES = ['master', 'worker', 'foreman', 'office'] as const
type ContractorType = typeof ALLOWED_TYPES[number]

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const query = getQuery(event)
  const filters = []

  // Фильтр по дате
  if (query.startDate) {
    const startDate = new Date(query.startDate as string)
    if (isNaN(startDate.getTime())) throw createError({ statusCode: 400, message: 'Неверный формат startDate' })
    filters.push(gte(expenses.operationDate, startDate))
  }
  if (query.endDate) {
    const endDate = new Date(query.endDate as string)
    if (isNaN(endDate.getTime())) throw createError({ statusCode: 400, message: 'Неверный формат endDate' })
    filters.push(lte(expenses.operationDate, endDate))
  }

  // Фильтр по контрагенту
  if (query.contractorType) {
    if (!ALLOWED_TYPES.includes(query.contractorType as ContractorType)) {
      throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
    }
    filters.push(eq(expenses.contractorType, query.contractorType as ContractorType))
  }
  if (query.contractorId) {
    const contractorId = parseInt(query.contractorId as string)
    if (isNaN(contractorId)) throw createError({ statusCode: 400, message: 'contractorId должен быть числом' })
    filters.push(eq(expenses.contractorId, contractorId))
  }

  const result = await db
    .select({
      expense: expenses,
      worker: workers,
      master: masters,
      object: objects,
      foreman: foremans,
      office: offices
    })
    .from(expenses)
    .leftJoin(workers, eq(expenses.contractorId, workers.id))
    .leftJoin(masters, eq(expenses.contractorId, masters.id))
    .leftJoin(foremans, eq(expenses.contractorId, foremans.id))
    .leftJoin(offices, eq(expenses.contractorId, offices.id))
    .leftJoin(objects, eq(expenses.objectId, objects.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(expenses.operationDate))

  return result.map(({ expense, worker, master, foreman, office, object }) => ({
    ...expense,
    contractorName:
      expense.contractorType === 'worker' ? worker?.name || 'Неизвестный рабочий' :
      expense.contractorType === 'master' ? master?.name || 'Неизвестный мастер' :
      expense.contractorType === 'foreman' ? foreman?.name || 'Неизвестный прораб' :
      office?.name || 'Неизвестный офис',
    objectName: object?.name
  }))
})
