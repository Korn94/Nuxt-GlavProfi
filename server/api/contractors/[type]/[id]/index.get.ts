// server/api/contractors/[type]/[id]/index.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { ContractorService } from '../../../../services/contractors'
import type { ContractorType } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

/**
 * GET /api/contractors/master/123
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  // Валидация
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
    const contractor = await ContractorService.getFullDTO(type, id)
    
    if (!contractor) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Contractor not found'
      })
    }

    return contractor
  } catch (error: any) {
    if (error.statusCode) throw error
    console.error(`Error fetching contractor:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contractor'
    })
  }
})
