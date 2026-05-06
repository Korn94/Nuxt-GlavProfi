// server/api/contractors/[type]/index.post.ts
/**
 * Назначение: Создание нового контрагента (мастер/рабочий/прораб/офис)
 * ⚠️ Требует право `canEditContractors` (проверяется в мидлваре)
 * 
 * @param {string} type — тип контрагента: 'master'|'worker'|'foreman'|'office' (из пути)
 * @body { name: string, phone?, comment?, balance?, dailyRate?, userId? }
 * @returns { statusCode: 201, contractor: Contractor }
 */

import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { ContractorService } from '../../../services/contractors'
import { CONTRACTOR_TYPES } from '~/types/contractors'
import type { ContractorType, ContractorCreateInput } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const type = getRouterParam(event, 'type') as ContractorType
  const body = await readBody<ContractorCreateInput>(event)

  // Валидация типа контрагента
  if (!CONTRACTOR_TYPES.includes(type)) {
    throw createError({ statusCode: 400, message: `Неверный тип контрагента: ${type}` })
  }

  // Валидация тела запроса
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Требуется тело запроса' })
  }

  // Валидация обязательных полей
  if (!body.name || body.name.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Имя контрагента обязательно' })
  }

  try {
    const contractor = await ContractorService.create(type, body)
    return { statusCode: 201, contractor }
  } catch (error: any) {
    console.error(`Ошибка создания контрагента (${type}):`, error)
    throw createError({ statusCode: 400, message: error.message || 'Не удалось создать контрагента' })
  }
})
