// server/api/contractors/[type]/index.post.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { ContractorService } from '../../../services/contractors'
import type { ContractorType, ContractorCreateInput } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

/**
 * POST /api/contractors/master
 * 
 * Body:
 * {
 *   "name": "Иван Петров",
 *   "phone": "+7 999 123 45 67",
 *   "comment": "Опытный мастер",
 *   "balance": "5000.00",
 *   "userId": 123
 * }
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const body = await readBody<ContractorCreateInput>(event)

  // Валидация типа
  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid contractor type: ${type}`
    })
  }

  // Проверка наличия тела запроса
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body is required'
    })
  }

  // Проверка наличия тела запроса
  if (!body || typeof body !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body is required'
    })
  }

  // Валидация обязательных полей
  if (!body.name || body.name.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Contractor name is required'
    })
  }

  try {
    const contractor = await ContractorService.create(type, body)
    return {
      statusCode: 201,
      contractor
    }
  } catch (error: any) {
    console.error(`Error creating ${type} contractor:`, error)
    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to create contractor'
    })
  }
})