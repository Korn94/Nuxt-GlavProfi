// server/api/price/list.get.ts
import { defineApi } from '../../utils/defineApi'
import { buildPriceTree } from '../..//utils/priceTree'
import { db } from '../../db'
import {
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems
} from '../../db/schema'

export default defineApi(async () => {
  console.log('📋 Запрос полного дерева прайс-листа')

  // 🔹 Параллельно получаем все данные одним циклом (вместо N+1 запросов)
  const [pages, categories, subcategories, items, details, dopworks] = await Promise.all([
    db.select().from(pricePages).orderBy(pricePages.order),
    db.select().from(priceCategories).orderBy(priceCategories.order),
    db.select().from(priceSubCategories).orderBy(priceSubCategories.order),
    db.select().from(priceItems).orderBy(priceItems.order),
    db.select().from(priceItemDetails).orderBy(priceItemDetails.order),
    db.select().from(priceAdditionalItems).orderBy(priceAdditionalItems.order)
  ])

  // console.log(`✅ Загружено: ${pages.length} страниц, ${categories.length} категорий, ${items.length} работ`)

  // 🔹 Собираем дерево через утилиту
  return buildPriceTree({
    pages,
    categories,
    subcategories,
    items,
    details,
    dopworks
  })
})
