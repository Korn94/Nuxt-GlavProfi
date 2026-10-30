// server/api/partners/[id]/index.put.ts
/**
 * Обновление профиля партнёра.
 */
import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { partners } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID партнёра' })
  }

  const body = await readBody(event)

  const update: Record<string, unknown> = {}

  if (body.companyName !== undefined) update.companyName = body.companyName?.toString()?.trim() || null
  if (body.contactPerson !== undefined) update.contactPerson = body.contactPerson?.toString()?.trim() || null
  if (body.phone !== undefined) update.phone = body.phone?.toString()?.trim() || null
  if (body.email !== undefined) update.email = body.email?.toString()?.trim() || null
  if (body.comment !== undefined) update.comment = body.comment?.toString()?.trim() || null
  if (body.isActive !== undefined) update.isActive = Boolean(body.isActive)
  if (body.userId !== undefined) update.userId = body.userId === null ? null : Number(body.userId)

  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Нет данных для обновления' })
  }

  await db.update(partners).set(update).where(eq(partners.id, id))

  const [updated] = await db.select().from(partners).where(eq(partners.id, id))
  return updated
})