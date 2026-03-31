// server/api/contractors/[type]/[id]/index.put.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { ContractorService } from '../../../../services/contractors'
import type { ContractorType, ContractorUpdateInput } from '~/types/contractors'
import { CONTRACTOR_TYPES, ContractorNotFoundError } from '~/types/contractors'

/**
 * PUT /api/contractors/master/123
 * 
 * Body (все поля опциональны):
 * {
 *   "name": "Иван Петров",
 *   "phone": "+7 999 123 45 67",
 *   "comment": "Лучший мастер",
 *   "balance": "6000.00",
 *   "userId": 123
 * }
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody<ContractorUpdateInput>(event)

  // Валидация типа
  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid contractor type'
    })
  }

  if (!id || id <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid ID'
    })
  }

  try {
    const contractor = await ContractorService.update(type, id, body)
    return contractor
  } catch (error: any) {
    if (error instanceof ContractorNotFoundError) {
      throw createError({
        statusCode: 404,
        statusMessage: error.message
      })
    }
    console.error(`Error updating contractor:`, error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to update contractor'
    })
  }
})
