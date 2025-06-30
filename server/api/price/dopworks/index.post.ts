// server/api/price/dopworks/index.post.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceAdditionalItems } from '../../../db/schema'
import { H3Event, readBody } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    
    if (!body.itemId || !body.dopwork || !body.unit || !body.price) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Необходимо указать itemId, label, dopwork, unit и price'
      })
    }

    const [newDopwork] = await db.insert(priceAdditionalItems).values({
      itemId: body.itemId,
      label: body.label ?? null,
      dopwork: body.dopwork,
      unit: body.unit,
      price: body.price,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).$returningId()

    return newDopwork
  } catch (error) {
    console.error('Ошибка добавления доп.работы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось добавить доп.работу'
    })
  }
})