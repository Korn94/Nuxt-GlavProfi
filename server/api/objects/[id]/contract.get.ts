// server/api/objects/[id]/contract.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectContracts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const [contract] = await db
      .select()
      .from(objectContracts)
      .where(eq(objectContracts.objectId, id))

    return contract || null
  } catch (error) {
    console.error('Ошибка получения договора:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
