// server/api/contractors/foremans/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { foremans } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID прорабов обязателен')

  try {
    const [foreman] = await db.select().from(foremans).where(eq(foremans.id, parseInt(id)))
    if (!foreman) throw new Error('Прораб не найден')
    return foreman
  } catch (error) {
    console.error('Ошибка получения прораба:', error)
    throw new Error('Ошибка сервера при получении работника офиса')
  }
})
