// server/api/objects/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  try {
    const [deleted] = await db.select().from(objects).where(eq(objects.id, parseInt(id)))
    if (!deleted) throw createError({ statusCode: 404, message: 'Объект не найден' })

    await db.delete(objects).where(eq(objects.id, parseInt(id)))

    return {
      message: 'Объект успешно удален',
      deleted
    }
  } catch (error) {
    console.error('Ошибка удаления объекта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при удалении объекта' })
  }
})
