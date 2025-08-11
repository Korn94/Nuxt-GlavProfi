// server/api/portfolio/[slug]/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { portfolioCases } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const params = event.context.params
  if (!params || !params.slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing case slug in request parameters'
    })
  }
  
  const slug = params.slug
  
  const [caseData] = await db
    .select()
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))
  
  if (!caseData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Case not found'
    })
  }
  
  return caseData
})
