// server/api/contractors/offices/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { offices } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID работника офиса обязателен')

  try {
    const [deletedOffices] = await db.select().from(offices).where(eq(offices.id, parseInt(id)))
    if (!deletedOffices) throw new Error('Офисный работник не найден')

    await db.delete(offices).where(eq(offices.id, parseInt(id)))

    return {
      message: 'Офисный работник успешно удален',
      deletedOffices
    }
  } catch (error) {
    console.error('Ошибка удаления работника офиса:', error)
    throw new Error('Ошибка сервера при удалении работника офиса')
  }
})
