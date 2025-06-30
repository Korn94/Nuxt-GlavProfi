// server/api/price/items/index.post.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceItems } from '../../../db/schema'
import { H3Event, readBody } from 'h3'

interface PriceItemRequestBody {
  subCategoryId: string
  name: string
  unit: string
  price: string
  order?: string
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)

    if (!body.subCategoryId || !body.name || !body.unit || !body.price) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Необходимо указать subCategoryId, name, unit и price'
      })
    }

    // Преобразуем цену в строку, удаляя лишние символы
    const parsedPrice = body.price.replace(',', '.').replace(/\s+/g, '')
    if (isNaN(parseFloat(parsedPrice))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Цена должна быть числом'
      })
    }

    const [newItem] = await db.insert(priceItems).values({
      subCategoryId: Number(body.subCategoryId),
      name: body.name,
      unit: body.unit,
      price: parsedPrice, // Передаём как строку!
      order: body.order ? Number(body.order) : 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).$returningId()

    return newItem
  } catch (error) {
    console.error('Ошибка добавления работы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось добавить работу'
    })
  }
})