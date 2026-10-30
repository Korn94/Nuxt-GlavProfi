// server/api/partner-leads/[id]/index.delete.ts
/**
 * Удаление сделки (лида) партнёра.
 */
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { partnerLeads } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID сделки' })
  }

  const [existing] = await db.select({ id: partnerLeads.id }).from(partnerLeads).where(eq(partnerLeads.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Сделка не найдена' })
  }

  await db.delete(partnerLeads).where(eq(partnerLeads.id, id))

  return { success: true, id }
})