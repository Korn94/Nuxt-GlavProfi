// server/api/contractors/[type]/index.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { ContractorService } from '../../../services/contractors'
import type { ContractorType } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

/**
 * GET /api/contractors/master
 * GET /api/contractors/worker
 * GET /api/contractors/foreman
 * GET /api/contractors/office
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType

  // Валидация типа
  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid contractor type: ${type}`
    })
  }

  try {
    const contractors = await ContractorService.getByTypeDTO(type)
    return {
      type,
      count: contractors.length,
      contractors
    }
  } catch (error: any) {
    console.error(`Error fetching ${type} contractors:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch contractors'
    })
  }
})
