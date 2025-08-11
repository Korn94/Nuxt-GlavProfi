// server/api/portfolio/[slug]/images/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../../db'
import { portfolioImages, portfolioCases } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const params = event.context.params
  if (!params || !params.slug) {
    throw createError({ statusCode: 400, statusMessage: 'Missing case slug' })
  }
  
  const slug = params.slug
  
  // Сначала получаем ID кейса по slug
  const [caseData] = await db
    .select({ id: portfolioCases.id })
    .from(portfolioCases)
    .where(eq(portfolioCases.slug, slug))
    
  if (!caseData) {
    throw createError({ statusCode: 404, statusMessage: 'Case not found' })
  }
  
  // Запрашиваем все изображения для кейса
  const images = await db
    .select()
    .from(portfolioImages)
    .where(eq(portfolioImages.caseId, caseData.id))
    
  // Возвращаем как массив объектов { type, url, pair_group }
  return images.map(img => ({
    type: img.type,
    url: img.url,
    pairGroup: img.pairGroup
  }))
})
