// server/api/contractors/foremans/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { foremans } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID прорабов обязателен')

  try {
    const [deletedForeman] = await db.select().from(foremans).where(eq(foremans.id, parseInt(id)))
    if (!deletedForeman) throw new Error('Прораб не найден')

    await db.delete(foremans).where(eq(foremans.id, parseInt(id)))

    return {
      message: 'Прораб успешно удален',
      deletedForeman
    }
  } catch (error) {
    console.error('Ошибка удаления прораба:', error)
    throw new Error('Ошибка сервера при удалении прораба')
  }
})
