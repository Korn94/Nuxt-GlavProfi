// server/api/price/[entity]/index.post.ts
import { defineApi } from '../../../utils/defineApi'
import { db } from '../../../db'
import { getRouterParam, readBody, createError } from 'h3'
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

// Обязательные поля для каждой сущности
const requiredFields: Record<string, string[]> = {
  pages: ['title', 'slug'],
  categories: ['pageId', 'name'],
  subcategories: ['categoryId', 'name'],
  items: ['subCategoryId', 'name', 'unit', 'price'],
  details: ['itemId', 'name', 'unit', 'price'],
  dopworks: ['itemId', 'dopwork', 'unit', 'price']
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
 * Проверяет наличие обязательных полей в объекте
 */
function validateRequired(body: Record<string, any>, fields: string[]) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '')
  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Отсутствуют обязательные поля: ${missing.join(', ')}`
    })
  }
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
  const table = tables[entityName!]
  const fields = requiredFields[entityName!]
  const name = entityNames[entityName!]

  if (!table || !fields) {
    throw createError({
      statusCode: 400,
      statusMessage: `Неизвестная сущность: ${entityName}`
    })
  }

  const body = await readBody(event)

  console.log(`➕ Создание записи: ${name}`)

  // Валидация обязательных полей
  validateRequired(body, fields)

  // Формируем данные для вставки
  const now = new Date()
  const data: Record<string, any> = {
    ...body,
    order: body.order ? Number(body.order) : 0,
    createdAt: now,
    updatedAt: now
  }

  // Особая обработка цены для сущностей, где она есть
  if (['items', 'details', 'dopworks'].includes(entityName!)) {
    data.price = parsePrice(body.price)
  }

  // Для доп. работ: label может быть null
  if (entityName === 'dopworks') {
    data.label = body.label ?? null
  }

  // Удаляем лишние поля, которых нет в таблице (например, случайно пришедшие)
  delete data.id

  // Вставляем запись
  const result = await db.insert(table).values(data).$returningId()
  const created = result[0]

  if (!created) {
    throw createError({
      statusCode: 500,
      statusMessage: `Не удалось создать запись: ${name}`
    })
  }

  console.log(`✅ Создана запись (${name}): ID ${created.id}`)

  return created
})
