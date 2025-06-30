// server/api/contractors/offices/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../db'
import { offices } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Валидация
    if (!body.name || !body.phone) {
      throw new Error('Имя и телефон обязательны')
    }

    // Добавление мастера
    await db.insert(offices).values({
      name: body.name,
      phone: body.phone,
      comment: body.comment || '',
      balance: body.balance || 0,
      userId: body.userId || null
    })

    // Получаем созданную запись
    const [newOffice] = await db.select()
      .from(offices)
      .orderBy(offices.id)
      .limit(1)

    return newOffice
  } catch (error) {
    console.error('Ошибка создания работника офиса:', error)
    throw new Error('Ошибка сервера при создании работника офиса')
  }
})
