// server/api/contractors/[type]/[id]/index.delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { ContractorService } from '../../../../services/contractors'
import type { ContractorType } from '~/types/contractors'
import { CONTRACTOR_TYPES, ContractorNotFoundError } from '~/types/contractors'

/**
 * DELETE /api/contractors/master/123
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

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
    await ContractorService.delete(type, id)
    return {
      success: true,
      message: `${type} contractor ${id} deleted successfully`
    }
  } catch (error: any) {
    if (error instanceof ContractorNotFoundError) {
      throw createError({
        statusCode: 404,
        statusMessage: error.message
      })
    }
    
    // Ошибка типа "Cannot delete contractor with positive balance"
    if (error.message?.includes('Cannot delete')) {
      throw createError({
        statusCode: 400,
        statusMessage: error.message
      })
    }

    console.error(`Error deleting contractor:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to delete contractor'
    })
  }
})
