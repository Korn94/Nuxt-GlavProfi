// server/api/price/pages/[id].get.ts
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

    const page = await db.select().from(pricePages).where(eq(pricePages.id, Number(id)))

    if (!page.length) {
      throw createError({ 
        statusCode: 404,
        statusMessage: 'Страница не найдена'
      })
    }

    return {
      page: page[0]
    }
  } catch (error) {
    console.error('Ошибка получения страницы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось получить данные страницы'
    })
  }
})