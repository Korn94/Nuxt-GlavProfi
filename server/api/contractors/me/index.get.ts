// server/api/contractors/me/index.get.ts
/**
 * Назначение: Получение данных ТЕКУЩЕГО пользователя-контрагента (только «свои» данные).
 *
 * В отличие от GET /api/contractors/[type]/[id] (требует право `contractors.view`),
 * этот эндпоинт НЕ принимает id/type из URL: они берутся из авторизованного
 * пользователя (event.context.user) и определяются на сервере.
 * Поэтому подставить чужого контрагента невозможно.
 *
 * @returns { ContractorDTO } — полные данные своего контрагента
 */
import { defineEventHandler, createError } from 'h3'
import { ContractorService } from '../../../services/contractors'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  const user = (event.context as any).user

  if (!user || !user.id) {
    throw createError({ statusCode: 401, message: 'Пользователь не авторизован' })
  }

  const contractorType = user.contractorType as ContractorType | undefined
  const contractorId = Number(user.contractorId || 0)

  if (!contractorType || !contractorId) {
    throw createError({ statusCode: 404, message: 'Контрагент не найден' })
  }

  const contractor = await ContractorService.getFullDTO(contractorType, contractorId)

  if (!contractor) {
    throw createError({ statusCode: 404, message: 'Контрагент не найден' })
  }

  return contractor
})
