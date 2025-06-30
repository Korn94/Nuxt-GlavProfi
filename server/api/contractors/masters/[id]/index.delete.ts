// server/api/contractors/masters/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { masters } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID мастера обязателен')

  try {
    const [deletedMaster] = await db.select().from(masters).where(eq(masters.id, parseInt(id)))
    if (!deletedMaster) throw new Error('Мастер не найден')

    await db.delete(masters).where(eq(masters.id, parseInt(id)))

    return {
      message: 'Мастер успешно удален',
      deletedMaster
    }
  } catch (error) {
    console.error('Ошибка удаления мастера:', error)
    throw new Error('Ошибка сервера при удалении мастера')
  }
})
