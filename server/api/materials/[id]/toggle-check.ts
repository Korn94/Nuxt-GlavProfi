// server/api/materials/toggle-check/[id].ts
/**
 * Назначение: Переключение флага наличия чека у материала
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID материала (из пути)
 * @body { hasReceipt: boolean }
 * @returns { Material } — обновлённая запись материала
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { materials } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  if (event.node.req.method !== 'PATCH') {
    throw createError({ statusCode: 405, message: 'Метод не разрешён' })
  }

  const { hasReceipt } = await readBody(event)
  if (hasReceipt === undefined) {
    throw createError({ statusCode: 400, message: 'Флаг hasReceipt обязателен' })
  }

  await db.update(materials).set({ hasReceipt }).where(eq(materials.id, parseInt(id)))

  const [updated] = await db.select().from(materials).where(eq(materials.id, parseInt(id)))
  if (!updated) throw createError({ statusCode: 404, message: 'Материал не найден' })

  return updated
})
