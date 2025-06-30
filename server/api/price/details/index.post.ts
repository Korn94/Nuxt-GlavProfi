// server/api/price/details/index.post.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceItemDetails } from '../../../db/schema'
import { H3Event, readBody } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    
    if (!body.itemId || !body.name || !body.unit || !body.price) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Необходимо указать itemId, name, unit и price'
      })
    }

    const [newDetail] = await db.insert(priceItemDetails).values({
      itemId: body.itemId,
      name: body.name,
      unit: body.unit,
      price: body.price,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).$returningId()

    return newDetail
  } catch (error) {
    console.error('Ошибка добавления детали работы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось добавить деталь работы'
    })
  }
})