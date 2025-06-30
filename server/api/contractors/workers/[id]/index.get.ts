// server/api/contractors/workers/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { workers } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID рабочего обязателен' })

  try {
    const [worker] = await db.select().from(workers).where(eq(workers.id, parseInt(id)))
    if (!worker) throw createError({ statusCode: 404, message: 'Рабочий не найден' })
    return worker
  } catch (error) {
    console.error('Ошибка получения рабочего:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при получении рабочего' })
  }
})
