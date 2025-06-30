// server/api/comings/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { comings } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID прихода обязателен')

  try {
    const [coming] = await db.select().from(comings).where(eq(comings.id, parseInt(id)))
    if (!coming) throw new Error('Приход не найден')
    return coming
  } catch (error) {
    throw new Error('Ошибка сервера при получении прихода')
  }
})
