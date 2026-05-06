// server/api/contractors/[type]/[id]/index.get.ts
/**
 * Назначение: Получение полных данных контрагента по ID и типу
 * ⚠️ Требует право `canViewContractors` (проверяется в мидлваре)
 * 
 * @param {string} type — тип контрагента: 'master'|'worker'|'foreman'|'office' (из пути)
 * @param {string} id — ID контрагента (из пути)
 * @returns { ContractorDTO } — полные данные контрагента
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { ContractorService } from '../../../../services/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
  }

  if (!id || id <= 0) {
    throw createError({ statusCode: 400, message: 'Неверный ID' })
  }

  const contractor = await ContractorService.getFullDTO(type, id)
  
  if (!contractor) {
    throw createError({ statusCode: 404, message: 'Контрагент не найден' })
  }

  return contractor
})
