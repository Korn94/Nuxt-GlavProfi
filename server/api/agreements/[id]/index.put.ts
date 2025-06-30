// server/api/agreements/[id].put.ts
import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { db } from '../../../db'
import { agreements } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID договоренности обязателен')

  try {
    const { text, status, masterId, workerId } = await readBody(event)

    if (!text && !status && masterId === undefined && workerId === undefined) {
      throw new Error('Нет данных для обновления')
    }

    const updates: any = {}
    if (text) updates.text = text
    if (status) updates.status = status
    if (masterId !== undefined) updates.masterId = masterId
    if (workerId !== undefined) updates.workerId = workerId

    await db.update(agreements).set(updates).where(eq(agreements.id, parseInt(id)))

    const [updatedAgreement] = await db.select().from(agreements).where(eq(agreements.id, parseInt(id)))
    if (!updatedAgreement) throw new Error('Договоренность не найдена')

    return updatedAgreement
  } catch (error) {
    console.error('Ошибка обновления договоренности:', error)
    throw new Error('Ошибка сервера при обновлении договоренности')
  }
})
