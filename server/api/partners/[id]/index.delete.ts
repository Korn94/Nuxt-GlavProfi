// server/api/partners/[id]/index.delete.ts
/**
 * Удаление партнёра (и, каскадно, его лидов — onDelete: 'cascade').
 */
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { partners } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = getRouterParam(event, 'id')
  const id = Number(idParam)

  if (!id || Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Некорректный ID партнёра' })
  }

  const [existing] = await db.select({ id: partners.id }).from(partners).where(eq(partners.id, id))
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Партнёр не найден' })
  }

  await db.delete(partners).where(eq(partners.id, id))

  return { success: true, id }
})