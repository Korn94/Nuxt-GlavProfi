// server/api/objects/acts/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectActs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const actId = Number(getRouterParam(event, 'id'))
  if (isNaN(actId)) throw createError({ statusCode: 400, message: 'Неверный ID акта' })

  const body = await readBody(event)
  const { name, amount, comment, status } = body

  const updateData: any = {}
  let hasChanges = false

  if (name !== undefined) { updateData.name = name; hasChanges = true }
  if (amount !== undefined) { updateData.amount = String(amount); hasChanges = true }
  if (comment !== undefined) { updateData.comment = comment; hasChanges = true }
  if (status !== undefined && ['prepared', 'awaiting', 'signed'].includes(status)) {
    updateData.status = status
    updateData.statusDate = new Date().toISOString().slice(0, 19).replace('T', ' ') // 'YYYY-MM-DD HH:MM:SS'
    hasChanges = true
  }

  if (!hasChanges) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  // updatedAt автоматически обновляется через $onUpdateNow() в схеме
  // Но если вы хотите явно — можно добавить:
  // updateData.updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

  try {
    await db
      .update(objectActs)
      .set(updateData)
      .where(eq(objectActs.id, actId))

    const [updated] = await db
      .select()
      .from(objectActs)
      .where(eq(objectActs.id, actId))

    if (!updated) throw createError({ statusCode: 404, message: 'Акт не найден' })

    return {
      ...updated,
      amount: parseFloat(updated.amount)
    }
  } catch (error) {
    console.error('Ошибка обновления акта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
