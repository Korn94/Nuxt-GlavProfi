// server/api/contractors/[type]/index.get.ts
import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { ContractorService } from '../../../services/contractors'
import type { ContractorType } from '~/types/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'

/**
 * GET /api/contractors/master?activeOnly=false
 * GET /api/contractors/worker
 * GET /api/contractors/foreman
 * GET /api/contractors/office
 * 
 * Query params:
 * - activeOnly: boolean (по умолчанию true — показывать только активных)
 */
export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type') as ContractorType
  const query = getQuery(event)
  
  // ✅ Парсим activeOnly: по умолчанию true, если передано 'false' — false
  const activeOnlyParam = query.activeOnly
  const activeOnly = activeOnlyParam === 'false' ? false : true

  // Валидация типа
  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid contractor type: ${type}`
    })
  }

  try {
    // ✅ Передаём activeOnly в сервис
    const contractors = await ContractorService.getByTypeDTO(type, activeOnly)
    
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
