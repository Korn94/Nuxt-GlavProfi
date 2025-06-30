// server/api/price/items/[id].put.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceSubCategories } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID подкатегории'
      })
    }

    await db.update(priceSubCategories)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(priceSubCategories.id, Number(id)))

    const [updatedSubcategory] = await db.select().from(priceSubCategories)
      .where(eq(priceSubCategories.id, Number(id)))

    return updatedSubcategory
  } catch (error) {
    console.error('Ошибка обновления подкатегории:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось обновить подкатегорию'
    })
  }
})