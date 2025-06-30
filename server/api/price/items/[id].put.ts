// server/api/price/items/[id].put.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceItems } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID работы'
      })
    }

    await db.update(priceItems)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(priceItems.id, Number(id)))

    const [updatedItem] = await db.select().from(priceItems)
      .where(eq(priceItems.id, Number(id)))

    return updatedItem
  } catch (error) {
    console.error('Ошибка обновления работы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось обновить работу'
    })
  }
})