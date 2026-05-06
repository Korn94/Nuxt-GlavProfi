// server/api/comings/[id]/index.get.ts
/**
 * Назначение: Получение данных конкретного прихода по ID
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID прихода (из пути)
 * @returns { Coming } — данные записи прихода
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID прихода обязателен' })

  const [coming] = await db.select().from(comings).where(eq(comings.id, parseInt(id)))
  if (!coming) throw createError({ statusCode: 404, message: 'Приход не найден' })
  
  return coming
})
