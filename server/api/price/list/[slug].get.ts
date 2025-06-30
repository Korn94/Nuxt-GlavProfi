// server/api/price/list/[slug].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { eq } from 'drizzle-orm'
import {
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems
} from '../../../db/schema'

export interface PriceDetail {
  id: number
  itemId: number
  name: string
  unit: string
  price: string
}

export interface PriceAdditionalItem {
  id: number
  itemId: number
  label: string | null
  dopwork: string
  unit: string
  price: string
}

export interface PriceItem {
  id: number
  subCategoryId: number
  name: string
  unit: string
  price: string
  details: PriceDetail[]
  dopworks: PriceAdditionalItem[]
}

export interface PriceSubCategory {
  id: number
  categoryId: number
  name: string
  items: PriceItem[]
}

export interface PriceCategory {
  id: number
  pageId: number
  name: string
  subcategories: PriceSubCategory[]
}

export interface PricePage {
  id: number
  title: string
  slug: string
  categories: PriceCategory[]
}

export default defineEventHandler(async (event) => {
  try {
    const slug = getRouterParam(event, 'slug')
    if (!slug) {
      throw createError({ statusCode: 400, statusMessage: 'Не указан slug страницы' })
    }

    // Один JOIN-запрос вместо множества
    const data = await db
      .select({
        pageId: pricePages.id,
        pageTitle: pricePages.title,
        pageSlug: pricePages.slug,

        categoryId: priceCategories.id,
        categoryName: priceCategories.name,

        subcategoryId: priceSubCategories.id,
        subcategoryName: priceSubCategories.name,

        itemId: priceItems.id,
        itemName: priceItems.name,
        itemUnit: priceItems.unit,
        itemPrice: priceItems.price,

        detailId: priceItemDetails.id,
        detailName: priceItemDetails.name,
        detailUnit: priceItemDetails.unit,
        detailPrice: priceItemDetails.price,

        dopworkId: priceAdditionalItems.id,
        dopworkLabel: priceAdditionalItems.label,
        dopworkName: priceAdditionalItems.dopwork,
        dopworkUnit: priceAdditionalItems.unit,
        dopworkPrice: priceAdditionalItems.price
      })
      .from(pricePages)
      .leftJoin(priceCategories, eq(pricePages.id, priceCategories.pageId))
      .leftJoin(priceSubCategories, eq(priceCategories.id, priceSubCategories.categoryId))
      .leftJoin(priceItems, eq(priceSubCategories.id, priceItems.subCategoryId))
      .leftJoin(priceItemDetails, eq(priceItems.id, priceItemDetails.itemId))
      .leftJoin(priceAdditionalItems, eq(priceItems.id, priceAdditionalItems.itemId))
      .where(eq(pricePages.slug, slug))

    if (!data.length) {
      throw createError({ statusCode: 404, statusMessage: `Страница с slug='${slug}' не найдена` })
    }

    // Группировка данных
    const result: PricePage = {
      id: data[0].pageId ?? 0,
      title: data[0].pageTitle ?? '',
      slug: data[0].pageSlug ?? '',
      categories: []
    }

    const categoryMap = new Map<number, PriceCategory>()
    const subcategoryMap = new Map<number, PriceSubCategory>()
    const itemMap = new Map<number, PriceItem>()

    for (const row of data) {
      if (!row.categoryId) continue

      // Категории
      if (!categoryMap.has(row.categoryId)) {
        const category: PriceCategory = {
          id: row.categoryId,
          pageId: row.pageId ?? 0,
          name: row.categoryName ?? '',
          subcategories: []
        }
        categoryMap.set(row.categoryId, category)
        result.categories.push(category)
      }

      const category = categoryMap.get(row.categoryId)!
      if (!category) continue

      // Подкатегории
      if (row.subcategoryId && !subcategoryMap.has(row.subcategoryId)) {
        const subcategory: PriceSubCategory = {
          id: row.subcategoryId,
          categoryId: row.categoryId,
          name: row.subcategoryName ?? '',
          items: []
        }
        subcategoryMap.set(row.subcategoryId, subcategory)
        category.subcategories.push(subcategory)
      }

      const subcategory = subcategoryMap.get(row.subcategoryId!)!
      if (!subcategory) continue

      // Работы
      if (row.itemId && !itemMap.has(row.itemId)) {
        const item: PriceItem = {
          id: row.itemId,
          subCategoryId: row.subcategoryId!,
          name: row.itemName ?? '',
          unit: row.itemUnit ?? '',
          price: row.itemPrice ?? '',
          details: [],
          dopworks: []
        }
        itemMap.set(row.itemId, item)
        subcategory.items.push(item)
      }

      const item = itemMap.get(row.itemId!)!
      if (!item) continue

      // Детали работ
      if (row.detailId) {
        item.details.push({
          id: row.detailId,
          itemId: row.itemId!,
          name: row.detailName ?? '',
          unit: row.detailUnit ?? '',
          price: row.detailPrice ?? ''
        })
      }

      // Допработки
      if (row.dopworkId) {
        item.dopworks.push({
          id: row.dopworkId,
          itemId: row.itemId!,
          label: row.dopworkLabel ?? null,
          dopwork: row.dopworkName ?? '',
          unit: row.dopworkUnit ?? '',
          price: row.dopworkPrice ?? ''
        })
      }
    }

    // Сортировка категорий по id перед возвратом
    result.categories.sort((a, b) => a.id - b.id)
    result.categories.forEach(category => {
      category.subcategories.sort((a, b) => a.id - b.id)
      category.subcategories.forEach(subcategory => {
        subcategory.items.sort((a, b) => a.id - b.id)
      })
    })


    return result
  } catch (error) {
    console.error('Ошибка при получении данных по slug:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось загрузить данные прайс-листа'
    })
  }
})
