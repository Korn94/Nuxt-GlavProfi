// server/api/price/dopworks/[id].put.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceAdditionalItems } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody, getRouterParam } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!id) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Не указан ID доп.работы'
      })
    }

    await db.update(priceAdditionalItems)
      .set({
        ...body,
        updatedAt: new Date()
      })
      .where(eq(priceAdditionalItems.id, Number(id)))

    const [updatedDopwork] = await db.select().from(priceAdditionalItems)
      .where(eq(priceAdditionalItems.id, Number(id)))

    return updatedDopwork
  } catch (error) {
    console.error('Ошибка обновления доп.работы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось обновить доп.работу'
    })
  }
})