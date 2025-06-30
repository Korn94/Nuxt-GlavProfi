// server/api/price/details/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceItemDetails } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID детали работы'
      })
    }

    await db.delete(priceItemDetails).where(eq(priceItemDetails.id, Number(id)))
    return { success: true }
  } catch (error) {
    console.error('Ошибка удаления детали работы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось удалить деталь работы'
    })
  }
})