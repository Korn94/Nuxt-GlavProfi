// server/api/portfolio/[slug]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { portfolioCases } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  const user = await verifyAuth(event)
  if (!['admin', 'manager'].includes(user.role)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const params = event.context.params
  if (!params || !params.slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing case slug' })
  }

  const slug = params.slug

  const [existingCase] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))

  if (!existingCase) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }

  await db
    .delete(portfolioCases)
    .where(eq(portfolioCases.slug, slug))

  return { message: 'Case deleted successfully' }
})
