// server/api/works/[id].get.ts
/**
 * Назначение: Получение данных конкретной работы по ID
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID работы (из пути)
 * @returns { Work } — данные работы
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const [work] = await db.select().from(works).where(eq(works.id, parseInt(id)))
  if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })
  
  return work
})
