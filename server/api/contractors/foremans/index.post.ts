// server/api/contractors/foremans/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../../db'
import { foremans } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Валидация
    if (!body.name || !body.phone) {
      throw new Error('Имя и телефон обязательны')
    }

    // Добавление мастера
    await db.insert(foremans).values({
      name: body.name,
      phone: body.phone,
      comment: body.comment || '',
      balance: body.balance || 0,
      userId: body.userId || null
    })

    // Получаем созданную запись
    const [newForeman] = await db.select()
      .from(foremans)
      .orderBy(foremans.id)
      .limit(1)

    return newForeman
  } catch (error) {
    console.error('Ошибка создания прораба:', error)
    throw new Error('Ошибка сервера при создании прораба')
  }
})
