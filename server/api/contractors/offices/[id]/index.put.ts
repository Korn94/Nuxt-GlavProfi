// server/api/contractors/offices/[id].put.ts
import { defineEventHandler, readBody, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { offices } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID работника офиса обязателен')

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

    await db.update(offices).set(updates).where(eq(offices.id, parseInt(id)))

    const [updatedOffices] = await db.select().from(offices).where(eq(offices.id, parseInt(id)))
    if (!updatedOffices) throw new Error('Офисный работник не найден')

    return updatedOffices
  } catch (error) {
    console.error('Ошибка обновления работника офиса:', error)
    throw new Error('Ошибка сервера при обновлении работника офиса')
  }
})
