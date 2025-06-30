// server/api/materials/index.get.ts
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { materials } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const objectId = query.objectId ? parseInt(query.objectId as string) : null
  const type = query.type

  try {
    let result = []

    if (type && objectId) {
      result = await db.select().from(materials).where(eq(materials.objectId, objectId))
    } else if (objectId) {
      result = await db.select().from(materials).where(eq(materials.objectId, objectId))
    } else {
      result = await db.select().from(materials)
    }

    return result
  } catch (error) {
    console.error('Ошибка получения материалов:', error)
    throw new Error('Не удалось получить материалы')
  }
})
