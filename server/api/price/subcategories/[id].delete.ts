// server/api/price/items/[id].delete.ts
import { defineEventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../db'
import { priceSubCategories } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id || isNaN(Number(id))) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Не указан ID подкатегории' 
      })
    }

    // Удаление подкатегории
    await db.delete(priceSubCategories).where(eq(priceSubCategories.id, Number(id)))

    return { message: 'Подкатегория успешно удалена' }
  } catch (error) {
    console.error('Ошибка удаления подкатегории:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось удалить подкатегорию'
    })
  }
})