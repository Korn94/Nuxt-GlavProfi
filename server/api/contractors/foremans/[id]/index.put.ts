// server/api/contractors/foremans/[id].put.ts
import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { foremans } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID прорабов обязателен')

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

    await db.update(foremans).set(updates).where(eq(foremans.id, parseInt(id)))

    const [updatedForeman] = await db.select().from(foremans).where(eq(foremans.id, parseInt(id)))
    if (!updatedForeman) throw new Error('Прораб не найден')

    return updatedForeman
  } catch (error) {
    console.error('Ошибка обновления прораба:', error)
    throw new Error('Ошибка сервера при обновлении прораба')
  }
})
