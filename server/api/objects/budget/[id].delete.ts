// server/api/objects/budget/[id].delete.ts
/**
 * Назначение: Удаление позиции сметы объекта
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID позиции сметы (из пути)
 * @returns { message: string, id: number }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectBudget } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const [deleted] = await db.select().from(objectBudget).where(eq(objectBudget.id, id))
  if (!deleted) throw createError({ statusCode: 404, message: 'Позиция не найдена' })

  await db.delete(objectBudget).where(eq(objectBudget.id, id))

  return { message: 'Позиция удалена', id }
})
