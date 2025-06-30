// server/api/contractors/workers/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { workers } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID рабочего обязателен' })

  try {
    const [deletedWorker] = await db.select().from(workers).where(eq(workers.id, parseInt(id)))
    if (!deletedWorker) throw createError({ statusCode: 404, message: 'Рабочий не найден' })

    await db.delete(workers).where(eq(workers.id, parseInt(id)))

    return {
      message: 'Рабочий успешно удален',
      deletedWorker
    }
  } catch (error) {
    console.error('Ошибка удаления рабочего:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при удалении рабочего' })
  }
})
