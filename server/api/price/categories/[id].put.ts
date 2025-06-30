// server/api/price/categories/[id].put.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceCategories } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID категории'
      })
    }

    // Обновляем запись
    await db.update(priceCategories)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(priceCategories.id, Number(id)))

    // Получаем обновленную запись
    const [updatedCategory] = await db.select().from(priceCategories)
      .where(eq(priceCategories.id, Number(id)))

    return updatedCategory
  } catch (error) {
    console.error('Ошибка обновления категории:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось обновить категорию'
    })
  }
})