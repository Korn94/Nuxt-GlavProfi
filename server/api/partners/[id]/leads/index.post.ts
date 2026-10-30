// server/api/partners/[id]/leads/index.post.ts
/**
 * Создание сделки (лида) партнёра. Номер лида генерируется автоматически (GP-XXXXX).
 * Вознаграждение партнёра рассчитывается автоматически из суммы договора по
 * публичной сетке (shared/constants/partners.ts — единый источник правды).
 *
 * @body {
 *   clientName: string, clientPhone: string, objectAddress?: string, objectArea?: number,
 *   description?: string, status?: LeadStatus, contractAmount?: number
 * }
 */
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { partners, partnerLeads } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { generateLeadNumber } from '../../../../utils/partnerLeads'
import { isPartnerLeadStatus, getPartnerReward } from 'shared/constants/partners'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const partnerId = Number(idParam)

  if (!partnerId || Number.isNaN(partnerId)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID партнёра' })
  }

  // Проверяем существование партнёра
  const [partner] = await db.select({ id: partners.id }).from(partners).where(eq(partners.id, partnerId))
  if (!partner) {
    throw createError({ statusCode: 404, statusMessage: 'Партнёр не найден' })
  }

  const body = await readBody(event)

  const clientName = body.clientName?.toString()?.trim()
  const clientPhone = body.clientPhone?.toString()?.trim()

  if (!clientName || !clientPhone) {
    throw createError({ statusCode: 400, statusMessage: 'Имя и телефон клиента обязательны' })
  }

  const status = body.status?.toString() ?? 'new'
  if (!isPartnerLeadStatus(status)) {
    throw createError({ statusCode: 400, statusMessage: 'Недопустимый этап сделки' })
  }

  // Сумма договора + авторасчёт вознаграждения по сетке.
  const contractAmountRaw =
    body.contractAmount !== undefined && body.contractAmount !== null
      ? Number(body.contractAmount)
      : null
  const contractAmount =
    contractAmountRaw !== null && Number.isFinite(contractAmountRaw)
      ? String(contractAmountRaw)
      : null
  const rewardAmount =
    contractAmountRaw !== null && Number.isFinite(contractAmountRaw)
      ? String(getPartnerReward(contractAmountRaw))
      : '0.00'

  const leadNumber = await generateLeadNumber()

  await db.insert(partnerLeads).values({
    leadNumber,
    partnerId,
    clientName,
    clientPhone,
    objectAddress: body.objectAddress?.toString()?.trim() || null,
    objectArea: body.objectArea !== undefined && body.objectArea !== null ? String(body.objectArea) : null,
    description: body.description?.toString()?.trim() || null,
    status,
    contractAmount,
    rewardAmount,
  })

  const [created] = await db
    .select()
    .from(partnerLeads)
    .where(eq(partnerLeads.leadNumber, leadNumber))

  return created
})