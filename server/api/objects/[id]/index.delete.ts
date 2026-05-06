// server/api/objects/[id]/index.delete.ts
/**
 * Назначение: Удаление объекта строительства
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { message: string, deleted: Object }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  const [deleted] = await db.select().from(objects).where(eq(objects.id, parseInt(id)))
  if (!deleted) throw createError({ statusCode: 404, message: 'Объект не найден' })

  await db.delete(objects).where(eq(objects.id, parseInt(id)))

  return { message: 'Объект успешно удален', deleted }
})
