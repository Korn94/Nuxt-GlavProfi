// server/api/agreements/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { agreements } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID договоренности обязателен')

  try {
    const [agreement] = await db.select().from(agreements).where(eq(agreements.id, parseInt(id)))
    if (!agreement) throw new Error('Договоренность не найдена')
    return agreement
  } catch (error) {
    console.error('Ошибка получения договоренности:', error)
    throw new Error('Ошибка сервера при получении договоренности')
  }
})
