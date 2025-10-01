// server/api/objects/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const body = await readBody(event)

    const updates: any = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.status !== undefined) updates.status = body.status
    if (body.address !== undefined) updates.address = body.address
    if (body.startDate !== undefined) updates.startDate = body.startDate
    if (body.plannedEndDate !== undefined) updates.plannedEndDate = body.plannedEndDate
    if (body.completedDate !== undefined) updates.completedDate = body.completedDate
    if (body.source !== undefined) updates.source = body.source
    if (body.contractType !== undefined) updates.contractType = body.contractType
    if (body.comment !== undefined) updates.comment = body.comment
    if (body.foremanId !== undefined) updates.foremanId = body.foremanId === null ? null : Number(body.foremanId)

    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    // Обновляем updatedAt вручную
    updates.updatedAt = new Date()

    await db.update(objects).set(updates).where(eq(objects.id, id))

    const [updated] = await db.select().from(objects).where(eq(objects.id, id))
    if (!updated) throw createError({ statusCode: 404, message: 'Объект не найден' })

    return updated
  } catch (error) {
    console.error('Ошибка обновления объекта:', error)
    throw createError({ statusCode: 500, message: 'Не удалось обновить объект' })
  }
})
