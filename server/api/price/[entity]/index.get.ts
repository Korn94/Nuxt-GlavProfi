// server/api/price/[entity]/index.get.ts
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { getRouterParam, getQuery, createError } from 'h3'
import { eq, and } from 'drizzle-orm'
import {
  pricePages,
  priceCategories,
  priceSubCategories,
  priceItems,
  priceItemDetails,
  priceAdditionalItems
} from '../../../db/schema'

// Словарь всех таблиц прайс-листа
const tables: Record<string, any> = {
  pages: pricePages,
  categories: priceCategories,
  subcategories: priceSubCategories,
  items: priceItems,
  details: priceItemDetails,
  dopworks: priceAdditionalItems
}

// Русские названия сущностей для красивых ошибок
const entityNames: Record<string, string> = {
  pages: 'страницы',
  categories: 'категории',
  subcategories: 'подкатегории',
  items: 'работы',
  details: 'детали работы',
  dopworks: 'доп. работы'
}

export default defineApi(async (event) => {
  const entityName = getRouterParam(event, 'entity')
  const table = tables[entityName!]
  const name = entityNames[entityName!]

  if (!table) {
    throw createError({
      statusCode: 400,
      statusMessage: `Неизвестная сущность: ${entityName}`
    })
  }

  const query = getQuery(event)

  console.log(`📋 Получение списка: ${name}`)

  // Формируем условия фильтрации из query-параметров
  const conditions: any[] = []

  // Поддерживаемые поля для фильтрации (внешние ключи)
  const filterableFields = ['pageId', 'categoryId', 'subCategoryId', 'itemId']

  for (const field of filterableFields) {
    if (query[field] !== undefined) {
      const value = Number(query[field])
      if (!isNaN(value) && table[field]) {
        conditions.push(eq(table[field], value))
      }
    }
  }

  // Строим запрос
  let queryBuilder: any = db.select().from(table)

  // Применяем фильтры
  if (conditions.length > 0) {
    queryBuilder = queryBuilder.where(and(...conditions))
  }

  // Сортировка по полю order (если оно есть в таблице)
  if (table.order) {
    queryBuilder = queryBuilder.orderBy(table.order)
  }

  // Выполняем запрос
  const records = await queryBuilder

  console.log(`✅ Получено записей (${name}): ${records.length}`)

  return records
})
