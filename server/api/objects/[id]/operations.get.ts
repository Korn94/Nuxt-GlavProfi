// server/api/objects/[id]/operations.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings, works, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  try {
    const [object] = await db.select().from(objects).where(eq(objects.id, parseInt(id)))
    if (!object) throw createError({ statusCode: 404, message: 'Объект не найден' })

    const comingsList = await db.select().from(comings).where(eq(comings.objectId, parseInt(id)))
    const worksList = await db.select().from(works).where(eq(works.objectId, parseInt(id)))

    return {
      comings: comingsList,
      works: worksList
    }
  } catch (error) {
    console.error('Ошибка получения операций:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при получении операций' })
  }
})
