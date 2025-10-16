// server/api/price/list.get.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../db'
import { eq } from 'drizzle-orm'
import { 
  pricePages, 
  priceCategories, 
  priceSubCategories, 
  priceItems, 
  priceItemDetails, 
  priceAdditionalItems 
} from '../../db/schema'

interface Dopwork {
  id: number
  itemId: number
  label: string | null
  dopwork: string
  unit: string
  price: string
  order: number | null
  createdAt: Date | null
  updatedAt: Date
}

interface DopworkGroup {
  label: string | null
  works: Dopwork[]
}

export default defineEventHandler(async () => {
  try {
    // 🔹 Получаем страницы, отсортированные по полю `order`
    const pages = await db
      .select()
      .from(pricePages)
      .orderBy(pricePages.order)

    const fullStructure = await Promise.all(pages.map(async (page) => {
      // 🔹 Категории — тоже по порядку
      const categories = await db
        .select()
        .from(priceCategories)
        .where(eq(priceCategories.pageId, page.id))
        .orderBy(priceCategories.order)

      const enrichedCategories = await Promise.all(categories.map(async (category) => {
        // 🔹 Подкатегории
        const subcategories = await db
          .select()
          .from(priceSubCategories)
          .where(eq(priceSubCategories.categoryId, category.id))
          .orderBy(priceSubCategories.order)

        const enrichedSubcategories = await Promise.all(subcategories.map(async (subcategory) => {
          // 🔹 Работы
          const items = await db
            .select()
            .from(priceItems)
            .where(eq(priceItems.subCategoryId, subcategory.id))
            .orderBy(priceItems.order)

          const enrichedItems = await Promise.all(items.map(async (item) => {
            // 🔹 Детали работ
            const details = await db
              .select()
              .from(priceItemDetails)
              .where(eq(priceItemDetails.itemId, item.id))
              .orderBy(priceItemDetails.order)

            // 🔹 Доп. работы
            const dopworks = await db
              .select()
              .from(priceAdditionalItems)
              .where(eq(priceAdditionalItems.itemId, item.id))
              .orderBy(priceAdditionalItems.order)

            return {
              ...item,
              details,
              dopworks: dopworks.reduce((acc: DopworkGroup[], dop: Dopwork) => {
                const group = acc.find(g => g.label === dop.label)
                if (group) {
                  group.works.push(dop)
                } else {
                  acc.push({ label: dop.label, works: [dop] })
                }
                return acc
              }, [])
            }
          }))

          return {
            ...subcategory,
            items: enrichedItems
          }
        }))

        return {
          ...category,
          subcategories: enrichedSubcategories
        }
      }))

      return {
        ...page,
        categories: enrichedCategories
      }
    }))

    return fullStructure
  } catch (error) {
    console.error('Ошибка получения полной структуры:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось получить полную структуру прайс-листа'
    })
  }
})
