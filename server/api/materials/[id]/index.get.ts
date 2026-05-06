// server/api/materials/[id].get.ts
/**
 * Назначение: Получение данных конкретного материала по ID
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID материала (из пути)
 * @returns { Material } — данные записи материала
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { materials } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  const [material] = await db.select().from(materials).where(eq(materials.id, parseInt(id)))
  if (!material) throw createError({ statusCode: 404, message: 'Материал не найден' })
  
  return material
})
