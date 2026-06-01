// server/api/price/list/[slug].get.ts
import { defineApi } from '../../../utils/defineApi'
import { buildPriceTree } from '../../../utils/priceTree'
import { db } from '../../../db'
import { eq, inArray } from 'drizzle-orm'
import { getRouterParam, createError } from 'h3'
import {
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems
} from '../../../db/schema'

export default defineApi(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Не указан slug страницы' 
    })
  }

  console.log(`📋 Запрос дерева прайс-листа для slug: ${slug}`)

  // 🔹 1. Получаем страницу по slug
  const [page] = await db
    .select()
    .from(pricePages)
    .where(eq(pricePages.slug, slug))
    .limit(1)

  if (!page) {
    throw createError({ 
      statusCode: 404, 
      statusMessage: `Страница со slug '${slug}' не найдена` 
    })
  }

  // 🔹 2. Загружаем категории для этой страницы
  const categories = await db
    .select()
    .from(priceCategories)
    .where(eq(priceCategories.pageId, page.id))
    .orderBy(priceCategories.order)

  if (categories.length === 0) {
    return { ...page, categories: [] }
  }

  const categoryIds = categories.map(c => c.id)

  // 🔹 3. Загружаем подкатегории по ID категорий
  const subcategories = await db
    .select()
    .from(priceSubCategories)
    .where(inArray(priceSubCategories.categoryId, categoryIds))
    .orderBy(priceSubCategories.order)

  let items: typeof priceItems.$inferSelect[] = []
  let details: typeof priceItemDetails.$inferSelect[] = []
  let dopworks: typeof priceAdditionalItems.$inferSelect[] = []

  if (subcategories.length > 0) {
    const subCategoryIds = subcategories.map(s => s.id)

    // 🔹 4. Загружаем работы
    items = await db
      .select()
      .from(priceItems)
      .where(inArray(priceItems.subCategoryId, subCategoryIds))
      .orderBy(priceItems.order)

    if (items.length > 0) {
      const itemIds = items.map(i => i.id)

      // 🔹 5. Параллельно загружаем детали и доп. работы
      ;[details, dopworks] = await Promise.all([
        db.select().from(priceItemDetails).where(inArray(priceItemDetails.itemId, itemIds)).orderBy(priceItemDetails.order),
        db.select().from(priceAdditionalItems).where(inArray(priceAdditionalItems.itemId, itemIds)).orderBy(priceAdditionalItems.order)
      ])
    }
  }

  console.log(`✅ Загружено: ${categories.length} категорий, ${items.length} работ`)

  // 🔹 Собираем дерево
  const tree = buildPriceTree({
    pages: [page],
    categories,
    subcategories,
    items,
    details,
    dopworks
  })

  return tree[0]
})
