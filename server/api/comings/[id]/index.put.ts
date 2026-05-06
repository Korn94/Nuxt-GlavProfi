// server\api\comings\[id]\index.put.ts
/**
 * Назначение: Обновление записи прихода (поступления средств)
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID прихода (из пути)
 * @body { amount?, comment?, objectId?, operationDate? } — все поля опциональны
 * @returns { Coming } — обновлённая запись прихода
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID прихода обязателен' })

  const body = await readBody(event)
  const { amount, comment, objectId, operationDate } = body

  // Собираем обновления только для переданных полей
  const updates: Record<string, any> = {}
  if (amount !== undefined) updates.amount = String(amount)
  if (comment !== undefined) updates.comment = comment
  if (objectId !== undefined) updates.objectId = parseInt(objectId)
  if (operationDate !== undefined) {
    const parsedDate = new Date(operationDate)
    if (isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Некорректный формат даты' })
    }
    updates.operationDate = parsedDate
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  await db.update(comings).set(updates).where(eq(comings.id, parseInt(id)))

  const [updatedComing] = await db.select().from(comings).where(eq(comings.id, parseInt(id)))
  if (!updatedComing) throw createError({ statusCode: 404, message: 'Приход не найден' })

  return updatedComing
})
