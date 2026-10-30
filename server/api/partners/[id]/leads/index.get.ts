// server/api/partners/[id]/leads/index.get.ts
/**
 * Список сделок (лидов) конкретного партнёра.
 */
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { partnerLeads, objects } from '../../../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const partnerId = Number(idParam)

  if (!partnerId || Number.isNaN(partnerId)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID партнёра' })
  }

  const rows = await db
    .select({
      lead: partnerLeads,
      objectName: objects.name,
    })
    .from(partnerLeads)
    .leftJoin(objects, eq(partnerLeads.objectId, objects.id))
    .where(eq(partnerLeads.partnerId, partnerId))
    .orderBy(desc(partnerLeads.createdAt))

  return rows.map(r => ({
    ...r.lead,
    objectName: r.objectName ?? null,
  }))
})