// server/api/price/details/[id].put.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceItemDetails } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID детали'
      })
    }

    await db.update(priceItemDetails)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(priceItemDetails.id, Number(id)))

    const [updatedDetail] = await db.select().from(priceItemDetails)
      .where(eq(priceItemDetails.id, Number(id)))

    return updatedDetail
  } catch (error) {
    console.error('Ошибка обновления детали:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось обновить деталь'
    })
  }
})