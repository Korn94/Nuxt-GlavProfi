// server/api/materials/[id].put.ts
/**
 * Назначение: Обновление данных материала/расхода
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID материала (из пути)
 * @body { name?, amount?, comment?, type?, objectId?, hasReceipt?, operationDate? }
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

  const body = await readBody(event)
  const materialId = parseInt(id)

  const updates: Record<string, any> = {}
  if (body.name) updates.name = body.name
  if (body.amount !== undefined) updates.amount = body.amount
  if (body.comment !== undefined) updates.comment = body.comment
  if (body.type) updates.type = body.type
  if (body.objectId !== undefined) updates.objectId = parseInt(body.objectId)
  if (body.hasReceipt !== undefined) updates.hasReceipt = body.hasReceipt

  if (body.operationDate) {
    const parsedDate = new Date(body.operationDate)
    if (isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Некорректная дата' })
    }
    updates.operationDate = parsedDate
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  await db.update(materials).set(updates).where(eq(materials.id, materialId))

  const [updated] = await db.select().from(materials).where(eq(materials.id, materialId))
  if (!updated) throw createError({ statusCode: 404, message: 'Материал не найден' })

  return updated
})
