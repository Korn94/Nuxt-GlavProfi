// server/api/comings/[id].put.ts
import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { db } from '../../../db'
import { comings } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID прихода обязателен')

  try {
    const { amount, comment, objectId, operationDate } = await readBody(event)

    if (!amount && !comment && !objectId && !operationDate) {
      throw new Error('Нет данных для обновления')
    }

    const updates: any = {}
    if (amount !== undefined) updates.amount = amount
    if (comment) updates.comment = comment
    if (objectId !== undefined) updates.objectId = objectId
    if (operationDate) updates.operationDate = operationDate

    await db.update(comings).set(updates).where(eq(comings.id, parseInt(id)))

    const [updatedComing] = await db.select().from(comings).where(eq(comings.id, parseInt(id)))
    if (!updatedComing) throw new Error('Приход не найден')

    return updatedComing
  } catch (error) {
    throw new Error('Ошибка сервера при обновлении прихода')
  }
})
