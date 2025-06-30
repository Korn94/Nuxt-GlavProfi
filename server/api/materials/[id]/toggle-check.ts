// server/api/materials/toggle-check/[id].ts

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { materials } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  // Только PATCH
  if (event.node.req.method !== 'PATCH') {
    throw createError({ statusCode: 405, message: 'Метод не разрешён' })
  }

  try {
    const { hasReceipt } = await readBody(event)
    if (hasReceipt === undefined) {
      throw createError({ statusCode: 400, message: 'Флаг hasReceipt обязателен' })
    }

    await db.update(materials)
      .set({ hasReceipt })
      .where(eq(materials.id, parseInt(id)))

    const [updated] = await db.select().from(materials).where(eq(materials.id, parseInt(id)))

    if (!updated) {
      throw createError({ statusCode: 404, message: 'Материал не найден' })
    }

    return updated
  } catch (error) {
    console.error('Ошибка переключения чека:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при изменении флага' 
    })
  }
})
