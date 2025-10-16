// server/api/price/pages/index.get.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { pricePages } from '../../../db/schema'
import { eq, desc, asc, and, or, not, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const pages = await db
      .select()
      .from(pricePages)
      .orderBy(pricePages.order) // <-- Сортировка по полю order

    return pages.map(page => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      metaTitle: page.metaTitle || `Цены на ${page.title} - 2025`,
      metaDescription: page.metaDescription || `Описание для ${page.title}`,
      metaKeywords: page.metaKeywords || `ключевые, слова, для ${page.title}`
    }))
  } catch (error) {
    console.error('Ошибка получения страниц прайса:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось загрузить список страниц прайса'
    })
  }
})
