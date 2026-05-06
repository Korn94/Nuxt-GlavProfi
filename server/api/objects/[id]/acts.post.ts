// server/api/objects/[id]/acts.post.ts
/**
 * Назначение: Создание нового акта для объекта
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @body { name: string, amount: number, comment?, order?: number, status?: 'prepared'|'awaiting'|'signed' }
 * @returns { Act } — созданный акт (с авто-генерацией ID)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectActs } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { name, amount, comment, order = 0, status = 'prepared' } = body

  if (!name || amount == null || amount < 0) {
    throw createError({ statusCode: 400, message: 'Название и сумма обязательны' })
  }

  const [newAct] = await db.insert(objectActs).values({
    objectId: id,
    name,
    amount: String(amount),
    comment,
    order,
    status
  }).$returningId()

  return newAct
})
