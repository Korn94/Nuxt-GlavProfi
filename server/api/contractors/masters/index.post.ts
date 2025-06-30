// server/api/contractors/masters/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../db'
import { masters } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Валидация
    if (!body.name || !body.phone) {
      throw new Error('Имя и телефон обязательны')
    }

    // Добавление мастера
    await db.insert(masters).values({
      name: body.name,
      phone: body.phone,
      comment: body.comment || '',
      balance: body.balance || 0,
      userId: body.userId || null
    })

    // Получаем созданную запись
    const [newMaster] = await db.select()
      .from(masters)
      .orderBy(masters.id)
      .limit(1)

    return newMaster
  } catch (error) {
    console.error('Ошибка создания мастера:', error)
    throw new Error('Ошибка сервера при создании мастера')
  }
})
