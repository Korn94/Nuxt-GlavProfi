// server/api/works/reject/[id].post.ts
import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  try {
    const body = await readBody(event)
    if (!body.reason) throw createError({ statusCode: 400, message: 'Требуется указать причину отклонения' })

    await db.update(works)
      .set({
        accepted: false,
        rejectedReason: body.reason
      })
      .where(eq(works.id, parseInt(id)))

    return { success: true }
  } catch (error) {
    console.error('Ошибка отклонения работы:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при отклонении работы' })
  }
})
