// server/api/price/pages/[id].put.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { pricePages } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID страницы'
      })
    }

    // Обновляем запись
    await db.update(pricePages)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(pricePages.id, Number(id)))

    // Получаем обновленную запись
    const [updatedPage] = await db.select().from(pricePages)
      .where(eq(pricePages.id, Number(id)))

    return updatedPage
  } catch (error) {
    console.error('Ошибка обновления страницы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось обновить страницу'
    })
  }
})