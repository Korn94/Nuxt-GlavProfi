// server/api/contractors/[type]/[id]/index.put.ts
/**
 * Назначение: Обновление данных контрагента (мастер/рабочий/прораб/офис)
 * ⚠️ Требует право `canEditContractors` (проверяется в мидлваре)
 * 
 * @param {string} type — тип контрагента: 'master'|'worker'|'foreman'|'office' (из пути)
 * @param {string} id — ID контрагента (из пути)
 * @body { name?, phone?, comment?, balance?, dailyRate?, userId?, isActive? } — все поля опциональны
 * @returns { Contractor } — обновлённая запись контрагента
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { ContractorService } from '../../../../services/contractors'
import { CONTRACTOR_TYPES, ContractorNotFoundError } from '~/types/contractors'
import type { ContractorType, ContractorUpdateInput } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const type = getRouterParam(event, 'type') as ContractorType
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody<ContractorUpdateInput>(event)

  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: 'Неверный тип контрагента' })
  }

  if (!id || id <= 0) {
    throw createError({ statusCode: 400, message: 'Неверный ID' })
  }

  try {
    const contractor = await ContractorService.update(type, id, body)
    return contractor
  } catch (error: any) {
    if (error instanceof ContractorNotFoundError) {
      throw createError({ statusCode: 404, message: error.message })
    }
    console.error(`Ошибка обновления контрагента (${type}):`, error)
    throw createError({ statusCode: 400, message: error.message || 'Не удалось обновить контрагента' })
  }
})
