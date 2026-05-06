// server/api/contractors/[type]/index.get.ts
/**
 * Назначение: Получение списка контрагентов по типу с фильтрацией по статусу
 * ⚠️ Требует право `canViewContractors` (проверяется в мидлваре)
 * 
 * @param {string} type — тип контрагента: 'master'|'worker'|'foreman'|'office' (из пути)
 * @query { activeOnly?: 'true'|'false' } — по умолчанию `true` (только активные)
 * @returns { type: string, count: number, contractors: ContractorDTO[] }
 */

import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { ContractorService } from '../../../services/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const type = getRouterParam(event, 'type') as ContractorType
  const query = getQuery(event)
  
  // Парсинг activeOnly: по умолчанию true, если явно 'false' — false
  const activeOnly = query.activeOnly === 'false' ? false : true

  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: `Неверный тип контрагента: ${type}` })
  }

  const contractors = await ContractorService.getByTypeDTO(type, activeOnly)
  
  return { type, count: contractors.length, contractors }
})
