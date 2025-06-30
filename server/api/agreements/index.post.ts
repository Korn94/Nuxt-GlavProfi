// server/api/agreements/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { db } from '../../db'
import { agreements, masters, workers } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const { text, status, masterId, workerId } = await readBody(event)

    // Проверка обязательных полей
    if (!text || !status) {
      throw new Error('Поля text и status обязательны')
    }

    // Опциональная проверка мастеров/рабочих
    if (masterId) {
      const [master] = await db.select().from(masters).where(eq(masters.id, masterId))
      if (!master) throw new Error('Мастер не найден')
    }

    if (workerId) {
      const [worker] = await db.select().from(workers).where(eq(workers.id, workerId))
      if (!worker) throw new Error('Рабочий не найден')
    }

    // Создание договоренности
    await db.insert(agreements).values({
      text,
      status,
      masterId,
      workerId
    })

    // Получаем последнюю созданную запись
    const [newAgreement] = await db
      .select()
      .from(agreements)
      .orderBy(desc(agreements.id))
      .limit(1)

    return newAgreement
  } catch (error) {
    console.error('Ошибка создания договоренности:', error)
    throw new Error('Ошибка сервера при создании договоренности')
  }
})
