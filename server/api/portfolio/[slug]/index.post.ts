// server/api/portfolio/[slug]/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../db'
import { portfolioCases } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '~/server/utils/auth'

export default eventHandler(async (event) => {
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const params = event.context.params
  if (!params || !params.id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing case ID' })
  }

  const caseId = parseInt(params.id)
  if (isNaN(caseId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid case ID' })
  }

  const body = await readBody(event)

  // Сначала обновляем кейс
  await db
    .update(portfolioCases)
    .set({
      ...body,
      updatedAt: new Date()
    })
    .where(eq(portfolioCases.id, caseId))

  // Затем выбираем обновлённый кейс
  const [updatedCase] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.id, caseId))

  if (!updatedCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  return updatedCase
})
