// server/api/materials/index.get.ts
/**
 * Назначение: Получение списка материалов с фильтрацией
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @query { objectId?: number, type?: 'incoming'|'outgoing', startDate?: string, endDate?: string }
 * @returns { Material[] } — массив записей материалов
 */

import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { materials } from '../../db/schema'
import { eq, gte, lte, and, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const query = getQuery(event)
  const objectId = query.objectId ? parseInt(query.objectId as string) : null
  const type = query.type

  const filters = []
  if (objectId) filters.push(eq(materials.objectId, objectId))
  if (type === 'incoming' || type === 'outgoing') filters.push(sql`${materials.type} = ${type}`)
  if (query.startDate) filters.push(gte(materials.operationDate, new Date(query.startDate as string)))
  if (query.endDate) filters.push(lte(materials.operationDate, new Date(query.endDate as string)))

  return await db.select().from(materials).where(filters.length > 0 ? and(...filters) : undefined)
})
