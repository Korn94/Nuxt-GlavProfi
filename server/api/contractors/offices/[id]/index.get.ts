// server/api/contractors/offices/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { offices } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID работника офиса обязателен')

  try {
    const [office] = await db.select().from(offices).where(eq(offices.id, parseInt(id)))
    if (!office) throw new Error('Офисный работник не найден')
    return office
  } catch (error) {
    console.error('Ошибка получения работника офиса:', error)
    throw new Error('Ошибка сервера при получении работника офиса')
  }
})
