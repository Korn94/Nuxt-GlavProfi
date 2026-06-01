// server/api/price/[entity]/[id].get.ts
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { getRouterParam, createError } from 'h3'
import { eq } from 'drizzle-orm'
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
  const id = getRouterParam(event, 'id')
  const table = tables[entityName!]
  const name = entityNames[entityName!]

  if (!table) {
    throw createError({
      statusCode: 400,
      statusMessage: `Неизвестная сущность: ${entityName}`
    })
  }

  if (!id || isNaN(Number(id))) {
    throw createError({
      statusCode: 400,
      statusMessage: `Не указан ID ${name}`
    })
  }

  const numericId = Number(id)

  console.log(`🔍 Получение записи: ${name} (ID ${numericId})`)

  // Ищем запись по id
  const [record] = await db.select().from(table).where(eq(table.id, numericId))

  if (!record) {
    throw createError({
      statusCode: 404,
      statusMessage: `Запись не найдена: ${name} (ID ${numericId})`
    })
  }

  return record
})
