// server/api/contractors/workers/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { workers } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID рабочего обязателен' })

  try {
    const body = await readBody(event)

    const updates: any = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.comment !== undefined) updates.comment = body.comment
    if (body.balance !== undefined) updates.balance = body.balance
    if (body.isNoName !== undefined) updates.isNoName = body.isNoName
    if (body.worksCompleted !== undefined) updates.worksCompleted = body.worksCompleted
    if (body.works !== undefined) updates.works = body.works
    if (body.objectId !== undefined) updates.objectId = body.objectId
    if (body.userId !== undefined) updates.userId = body.userId

    // Проверка наличия полей для обновления
    if (Object.keys(updates).length === 0) {
      throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
    }

    await db.update(workers).set(updates).where(eq(workers.id, parseInt(id)))

    const [updatedWorker] = await db.select().from(workers).where(eq(workers.id, parseInt(id)))
    if (!updatedWorker) throw createError({ statusCode: 404, message: 'Рабочий не найден' })

    return updatedWorker
  } catch (error) {
    console.error('Ошибка обновления рабочего:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при обновлении рабочего' })
  }
})
