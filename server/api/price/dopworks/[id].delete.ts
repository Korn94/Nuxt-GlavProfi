// server/api/price/dopworks/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceAdditionalItems } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID доп.работы'
      })
    }

    await db.delete(priceAdditionalItems).where(eq(priceAdditionalItems.id, Number(id)))
    return { success: true }
  } catch (error) {
    console.error('Ошибка удаления доп.работы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось удалить доп.работу'
    })
  }
})