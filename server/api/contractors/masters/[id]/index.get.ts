// server/api/contractors/masters/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { masters } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID мастера обязателен')

  try {
    const [master] = await db.select().from(masters).where(eq(masters.id, parseInt(id)))
    if (!master) throw new Error('Мастер не найден')
    return master
  } catch (error) {
    console.error('Ошибка получения мастера:', error)
    throw new Error('Ошибка сервера при получении мастера')
  }
})
