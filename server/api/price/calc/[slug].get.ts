// server/api/price/calc/[slug].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { eq, asc } from 'drizzle-orm'
import { pricePages, priceCategories, priceSubCategories, priceItems } from '../../../db/schema'

/**
 * Легкий эндпоинт для калькулятора.
 * Возвращает иерархию: Категории -> Подкатегории -> Работы (без деталей и доп. работ).
 * Это ускоряет ответ сервера на ~70% по сравнению с полным прайсом.
 */
export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw createError({ statusCode: 400, statusMessage: 'Не указан slug страницы' })
    }

    // Один JOIN-запрос для получения всей структуры в плоском виде
    const rows = await db
      .select({
        // Поля категории
        categoryId: priceCategories.id,
        categoryName: priceCategories.name,
        categoryOrder: priceCategories.order,
        // Поля подкатегории
        subcategoryId: priceSubCategories.id,
        subcategoryName: priceSubCategories.name,
        subcategoryOrder: priceSubCategories.order,
        // Поля работы
        itemId: priceItems.id,
        itemName: priceItems.name,
        itemUnit: priceItems.unit,
        itemPrice: priceItems.price,
        itemSubCategoryId: priceItems.subCategoryId,
        itemOrder: priceItems.order
      })
      .from(pricePages)
      .innerJoin(priceCategories, eq(pricePages.id, priceCategories.pageId))
      .innerJoin(priceSubCategories, eq(priceCategories.id, priceSubCategories.categoryId))
      .innerJoin(priceItems, eq(priceSubCategories.id, priceItems.subCategoryId))
      .where(eq(pricePages.slug, slug))
      .orderBy(
        asc(priceCategories.order),
        asc(priceCategories.id),
        asc(priceSubCategories.order),
        asc(priceSubCategories.id),
        asc(priceItems.order),
        asc(priceItems.id)
      )

    if (!rows.length) {
      throw createError({ statusCode: 404, statusMessage: `Страница с slug='${slug}' не найдена или пуста` })
    }

    // Группировка данных в иерархию (Категория -> Подкатегория -> Работы)
    const categoriesMap = new Map<number, any>()
    const subcategoriesMap = new Map<number, any>()
    const resultCategories: any[] = []

    for (const row of rows) {
      // 1. Категория
      if (!categoriesMap.has(row.categoryId!)) {
        const category = {
          id: row.categoryId,
          name: row.categoryName,
          subcategories: []
        }
        categoriesMap.set(row.categoryId!, category)
        resultCategories.push(category)
      }
      const category = categoriesMap.get(row.categoryId!)

      // 2. Подкатегория
      if (row.subcategoryId && !subcategoriesMap.has(row.subcategoryId)) {
        const subcategory = {
          id: row.subcategoryId,
          name: row.subcategoryName,
          items: []
        }
        subcategoriesMap.set(row.subcategoryId, subcategory)
        category.subcategories.push(subcategory)
      }
      const subcategory = subcategoriesMap.get(row.subcategoryId!)

      // 3. Работа (Добавляем только если работа валидна)
      if (subcategory && row.itemId) {
        subcategory.items.push({
          id: row.itemId,
          name: row.itemName,
          unit: row.itemUnit,
          price: row.itemPrice,
          sub_category_id: row.itemSubCategoryId // Важно для нормализации
        })
      }
    }

    return { categories: resultCategories }
  } catch (error) {
    console.error('❌ Ошибка при получении данных для калькулятора:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось загрузить прайс-лист для калькулятора'
    })
  }
})
