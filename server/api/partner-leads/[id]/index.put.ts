// server/api/partner-leads/[id]/index.put.ts
/**
 * Обновление сделки (лида): смена этапа, финансов, данных клиента, привязка объекта.
 * Основной способ ручной простановки этапа сделки (админ/менеджер).
 */
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { partnerLeads } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { isPartnerLeadStatus } from 'shared/constants/partners'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID сделки' })
  }

  const body = await readBody(event)

  const update: Record<string, unknown> = {}

  if (body.status !== undefined) {
    const status = body.status?.toString()
    if (!isPartnerLeadStatus(status)) {
      throw createError({ statusCode: 400, statusMessage: 'Недопустимый этап сделки' })
    }
    update.status = status
  }

  if (body.clientName !== undefined) update.clientName = body.clientName?.toString()?.trim()
  if (body.clientPhone !== undefined) update.clientPhone = body.clientPhone?.toString()?.trim()
  if (body.objectAddress !== undefined) update.objectAddress = body.objectAddress?.toString()?.trim() || null
  if (body.description !== undefined) update.description = body.description?.toString()?.trim() || null

  if (body.objectArea !== undefined) {
    update.objectArea = body.objectArea === null ? null : String(body.objectArea)
  }
  if (body.contractAmount !== undefined) {
    update.contractAmount = body.contractAmount === null ? null : String(body.contractAmount)
  }
  if (body.rewardAmount !== undefined) {
    update.rewardAmount = body.rewardAmount === null ? '0.00' : String(body.rewardAmount)
  }
  if (body.objectId !== undefined) {
    update.objectId = body.objectId === null ? null : Number(body.objectId)
  }

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Нет данных для обновления' })
  }

  await db.update(partnerLeads).set(update).where(eq(partnerLeads.id, id))

  const [updated] = await db.select().from(partnerLeads).where(eq(partnerLeads.id, id))
  return updated
})