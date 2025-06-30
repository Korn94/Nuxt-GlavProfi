// server/api/works/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  try {
    const [work] = await db.select().from(works).where(eq(works.id, parseInt(id)))
    if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })
    return work
  } catch (error) {
    console.error('Ошибка получения работы:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при получении работы' 
    })
  }
})
