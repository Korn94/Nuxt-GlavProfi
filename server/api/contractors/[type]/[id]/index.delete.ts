// server/api/contractors/[type]/[id]/index.delete.ts
/**
 * Назначение: Удаление контрагента (мастер/рабочий/прораб/офис)
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} type — тип контрагента: 'master'|'worker'|'foreman'|'office' (из пути)
 * @param {string} id — ID контрагента (из пути)
 * @returns { success: boolean, message: string }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { ContractorService } from '../../../../services/contractors'
import { CONTRACTOR_TYPES, ContractorNotFoundError } from '~/types/contractors'
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

  try {
    await ContractorService.delete(type, id)
    return { success: true, message: `Контрагент ${type} #${id} успешно удалён` }
  } catch (error: any) {
    if (error instanceof ContractorNotFoundError) {
      throw createError({ statusCode: 404, message: error.message })
    }
    
    // Ошибка блокировки удаления (например, положительный баланс)
    if (error.message?.includes('Cannot delete')) {
      throw createError({ statusCode: 400, message: error.message })
    }

    console.error(`Ошибка удаления контрагента (${type}):`, error)
    throw createError({ statusCode: 500, message: error.message || 'Не удалось удалить контрагента' })
  }
})
