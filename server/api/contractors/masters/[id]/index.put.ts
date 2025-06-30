// server/api/contractors/masters/[id].put.ts
import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { masters } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID мастера обязателен')

  try {
    const { name, phone, comment, balance, objectId, userId } = await readBody(event)

    if (!name && !phone && !comment && balance === undefined && objectId === undefined && userId === undefined) {
      throw new Error('Нет данных для обновления')
    }

    const updates: any = {}
    if (name) updates.name = name
    if (phone) updates.phone = phone
    if (comment) updates.comment = comment
    if (balance !== undefined) updates.balance = balance
    if (objectId !== undefined) updates.objectId = objectId
    if (userId !== undefined) updates.userId = userId

    await db.update(masters).set(updates).where(eq(masters.id, parseInt(id)))

    const [updatedMaster] = await db.select().from(masters).where(eq(masters.id, parseInt(id)))
    if (!updatedMaster) throw new Error('Мастер не найден')

    return updatedMaster
  } catch (error) {
    console.error('Ошибка обновления мастера:', error)
    throw new Error('Ошибка сервера при обновлении мастера')
  }
})
