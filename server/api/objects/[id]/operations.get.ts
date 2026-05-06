// server/api/objects/[id]/operations.get.ts
/**
 * Назначение: Получение всех операций объекта (приходы + работы)
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { comings: Coming[], works: Work[] }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings, works, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  const [object] = await db.select().from(objects).where(eq(objects.id, parseInt(id)))
  if (!object) throw createError({ statusCode: 404, message: 'Объект не найден' })

  const comingsList = await db.select().from(comings).where(eq(comings.objectId, parseInt(id)))
  const worksList = await db.select().from(works).where(eq(works.objectId, parseInt(id)))

  return { comings: comingsList, works: worksList }
})
