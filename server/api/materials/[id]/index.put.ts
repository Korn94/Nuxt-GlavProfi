// server/api/materials/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { materials } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    const body = await readBody(event)

    const updates: any = {}
    if (body.name) updates.name = body.name
    if (body.amount !== undefined) updates.amount = body.amount
    if (body.comment !== undefined) updates.comment = body.comment
    if (body.type) updates.type = body.type
    if (body.objectId !== undefined) updates.objectId = parseInt(body.objectId)
    if (body.hasReceipt !== undefined) updates.hasReceipt = body.hasReceipt

    // ✅ Обработка operationDate
    if (body.operationDate) {
      const parsedDate = new Date(body.operationDate)
      if (isNaN(parsedDate.getTime())) {
        throw createError({ statusCode: 400, message: 'Некорректная дата операции' })
      }
      updates.operationDate = parsedDate
    }

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    await db.update(materials).set(updates).where(eq(materials.id, parseInt(id)))

    const [updated] = await db.select().from(materials).where(eq(materials.id, parseInt(id)))
    if (!updated) throw createError({ statusCode: 404, message: 'Материал не найден' })

    return updated
  } catch (error) {
    console.error('Ошибка обновления материала:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при обновлении материала' 
    })
  }
})
