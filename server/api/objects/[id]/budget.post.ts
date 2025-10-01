// server/api/objects/[id]/budget.post.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, order = 0, workProgress = 'queued', actStatus = 'none' } = body

  if (!name || amount == null) {
    throw createError({ statusCode: 400, message: 'Название и сумма обязательны' })
  }

  try {
    const [newItem] = await db
      .insert(objectBudget)
      .values({
        objectId: id,
        name,
        amount: String(amount),
        comment,
        order,
        workProgress,
        actStatus,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .$returningId()

    return newItem
  } catch (error) {
    console.error('Ошибка создания позиции сметы:', error)
    throw createError({ statusCode: 500, message: 'Не удалось добавить позицию' })
  }
})
