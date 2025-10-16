// server/api/objects/[id]/acts.post.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectActs } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, order = 0, status = 'prepared' } = body

  if (!name || amount == null || amount < 0) {
    throw createError({ statusCode: 400, message: 'Название и сумма обязательны' })
  }

  try {
    // Проверяем, нет ли уже акта с таким названием? (опционально)
    // Пропускаем — пусть можно дублировать названия

    const [newAct] = await db
      .insert(objectActs)
      .values({
        objectId: id,
        name,
        amount: String(amount),
        comment,
        order,
        status
        // ❌ Не передаём: statusDate, createdAt, updatedAt — они по умолчанию!
      })
      .$returningId()

    return newAct
  } catch (error) {
    console.error('Ошибка создания акта:', error)
    throw createError({ statusCode: 500, message: 'Не удалось создать акт' })
  }
})
