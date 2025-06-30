// server/api/objects/comings/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  try {
    const comingsList = await db.select().from(comings).where(eq(comings.objectId, parseInt(id)))
    return comingsList
  } catch (error) {
    console.error('Ошибка получения приходов:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при получении приходов' })
  }
})
