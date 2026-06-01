// server/api/price/[entity]/[id].put.ts
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { getRouterParam, readBody, createError } from 'h3'
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

/**
 * Парсит цену из строки в корректный формат для БД
 */
function parsePrice(price: any): string {
  if (typeof price === 'number') return String(price)
  const parsed = String(price).replace(',', '.').replace(/\s+/g, '')
  if (isNaN(parseFloat(parsed))) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Цена должна быть числом'
    })
  }
  return parsed
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
  const body = await readBody(event)

  console.log(`✏️ Обновление записи: ${name} (ID ${numericId})`)

  // Проверяем, существует ли запись
  const [existing] = await db.select().from(table).where(eq(table.id, numericId))
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: `Запись не найдена: ${name} (ID ${numericId})`
    })
  }

  // Формируем данные для обновления
  const data: Record<string, any> = {
    ...body,
    updatedAt: new Date()
  }

  // Особая обработка цены для сущностей, где она есть
  if (['items', 'details', 'dopworks'].includes(entityName!) && body.price !== undefined) {
    data.price = parsePrice(body.price)
  }

  // Удаляем системные поля, которые нельзя обновлять
  delete data.id
  delete data.createdAt

  // Обновляем запись
  await db.update(table).set(data).where(eq(table.id, numericId))

  // Получаем обновленную запись
  const [updated] = await db.select().from(table).where(eq(table.id, numericId))

  console.log(`✅ Обновлена запись (${name}): ID ${numericId}`)

  return updated
})
