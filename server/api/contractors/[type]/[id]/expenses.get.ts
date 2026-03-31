// server/api/contractors/[type]/[id]/expenses.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { expenses } from '../../../../db/schema'
import { and, eq, desc } from 'drizzle-orm'
import type { ContractorType } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

/**
 * GET /api/contractors/master/123/expenses
 * Возвращает историю расходов, связанных с контрагентом
 * (платежи компании контрагенту → + к балансу контрагента)
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  // Валидация
  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid contractor type' })
  }
  if (!id || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  }

  try {
    const list = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.contractorType, type),
          eq(expenses.contractorId, id)
        )
      )
      .orderBy(desc(expenses.operationDate))

    // Маппинг в удобный формат для фронтенда
    return list.map(e => ({
      id: e.id,
      type: 'expense' as const,
      title: e.expenseType || 'Расход',
      amount: parseFloat(String(e.amount)),
      date: e.operationDate instanceof Date 
        ? e.operationDate.toISOString() 
        : e.operationDate,
      object: e.objectId,
      comment: e.comment,
      paymentDate: e.paymentDate instanceof Date 
        ? e.paymentDate.toISOString() 
        : e.paymentDate
    }))
  } catch (error: any) {
    console.error('[API] Error fetching contractor expenses:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch expenses history'
    })
  }
})
