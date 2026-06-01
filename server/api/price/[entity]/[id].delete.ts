// server/api/price/[entity]/[id].delete.ts
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

  console.log(`🗑️ Удаление записи: ${name} (ID ${numericId})`)

  // Проверяем, существует ли запись
  const [existing] = await db.select().from(table).where(eq(table.id, numericId))
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: `Запись не найдена: ${name} (ID ${numericId})`
    })
  }

  // Удаляем запись
  await db.delete(table).where(eq(table.id, numericId))

  console.log(`✅ Удалена запись (${name}): ID ${numericId}`)

  return { success: true }
})
