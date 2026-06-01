// server/api/price/pages/index.get.ts
// Особая логика для страниц (SEO-поля)
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { pricePages } from '../../../db/schema'

export default defineApi(async () => {
  console.log('📋 Запрос списка страниц прайс-листа')

  const pages = await db
    .select()
    .from(pricePages)
    .orderBy(pricePages.order)

  console.log(`✅ Загружено страниц: ${pages.length}`)

  // Особая логика: формируем SEO-поля по умолчанию, если они пустые
  return pages.map(page => ({
    id: page.id,
    title: page.title,
    slug: page.slug,
    metaTitle: page.metaTitle || `Цены на ${page.title} - 2026`,
    metaDescription: page.metaDescription || `Описание для ${page.title}`,
    metaKeywords: page.metaKeywords || `ключевые, слова, для ${page.title}`
  }))
})
