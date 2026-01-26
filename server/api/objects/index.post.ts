// server/api/objects/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { objects } from '../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.name || !body.status) {
      throw createError({ statusCode: 400, message: 'Название и статус обязательны' })
    }

    // Проверка на допустимый статус
    if (!['active', 'waiting', 'completed', 'canceled'].includes(body.status)) {
      throw createError({ statusCode: 400, message: 'Недопустимый статус объекта' })
    }

    await db.insert(objects).values({
      name: body.name,
      status: body.status,
      totalIncome: '0.00',
      totalWorks: '0.00',
      profit: '0.00',
      totalBalance: '0.00',
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const [newObject] = await db.select().from(objects).orderBy(objects.id).limit(1)
    return newObject
  } catch (error) {
    console.error('Ошибка создания объекта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при создании объекта' })
  }
})
