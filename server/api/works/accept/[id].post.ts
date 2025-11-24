// server/api/works/accept/[id].post.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  try {
    const [work] = await db.select().from(works).where(eq(works.id, parseInt(id)))
    if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })
    if (work.accepted) throw createError({ statusCode: 400, message: 'Работа уже принята' })

    // Обновляем статус работы
    await db.update(works).set({
      accepted: true,
      acceptedDate: new Date()
    }).where(eq(works.id, parseInt(id)))

    return { success: true }
  } catch (error) {
    console.error('Ошибка принятия работы:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при принятии работы' })
  }
})
