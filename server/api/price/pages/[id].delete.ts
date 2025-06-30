// server/api/price/pages/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { pricePages } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID страницы'
      })
    }

    await db.delete(pricePages).where(eq(pricePages.id, Number(id)))
    return { success: true }
  } catch (error) {
    console.error('Ошибка удаления страницы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось удалить страницу'
    })
  }
})