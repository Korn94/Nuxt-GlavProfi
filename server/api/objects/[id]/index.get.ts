// server/api/objects/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objects, foremans } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  try {
    const [objectWithForeman] = await db
      .select({
        object: objects,
        foreman: foremans
      })
      .from(objects)
      .leftJoin(foremans, eq(objects.foremanId, foremans.id))
      .where(eq(objects.id, parseInt(id)))

    if (!objectWithForeman?.object) {
      throw createError({ statusCode: 404, message: 'Объект не найден' })
    }

    return {
      ...objectWithForeman.object,
      foreman: objectWithForeman.foreman
        ? {
            id: objectWithForeman.foreman.id,
            name: objectWithForeman.foreman.name,
            phone: objectWithForeman.foreman.phone
          }
        : null
    }
  } catch (error) {
    console.error('Ошибка получения объекта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при получении объекта' })
  }
})