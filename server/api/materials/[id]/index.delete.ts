// server/api/materials/[id].delete.ts
/**
 * Назначение: Удаление записи материала/расхода
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID материала (из пути)
 * @returns { message: string, deleted: Material }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { materials } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  const [deleted] = await db.select().from(materials).where(eq(materials.id, parseInt(id)))
  if (!deleted) throw createError({ statusCode: 404, message: 'Материал не найден' })

  // 🗑️ Удаляем запись материала
  await db.delete(materials).where(eq(materials.id, parseInt(id)))

  return { message: 'Материал успешно удален', deleted }
})
