// server/api/portfolio/[slug]/works/index.get.ts
import { createError, eventHandler } from 'h3'
import { db } from '../../../../db'
import { portfoCaseWorks, portfolioCases } from '../../../../db/schema'
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
  
  // Сначала получаем ID кейса по slug
  const [caseData] = await db
    .select({ id: portfolioCases.id })
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))
    
  if (!caseData) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Case not found'
    })
  }
  
  const works = await db
    .select()
    .from(portfoCaseWorks)
    .where(eq(portfoCaseWorks.caseId, caseData.id))
    .orderBy(portfoCaseWorks.order)
    
  return works
})
