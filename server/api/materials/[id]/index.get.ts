// server/api/materials/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { materials } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    const [material] = await db.select().from(materials).where(eq(materials.id, parseInt(id)))
    if (!material) throw createError({ statusCode: 404, message: 'Материал не найден' })
    return material
  } catch (error) {
    console.error('Ошибка получения материала:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при получении материала' 
    })
  }
})
