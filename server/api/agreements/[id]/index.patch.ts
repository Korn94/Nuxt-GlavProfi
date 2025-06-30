// server/api/agreements/[id].putch.ts
import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { db } from '../../../db'
import { agreements } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  if (!id) throw new Error('ID договоренности обязателен')

  try {
    // Обновляем статус
    await db.update(agreements)
      .set({
        status: body.status,
        updatedAt: new Date()
      })
      .where(eq(agreements.id, parseInt(id)))

    // Возвращаем обновлённую запись
    const [updated] = await db.select().from(agreements).where(eq(agreements.id, parseInt(id)))
    return updated
  } catch (error) {
    console.error('Ошибка обновления договоренности:', error)
    throw new Error('Ошибка сервера при обновлении договоренности')
  }
})
