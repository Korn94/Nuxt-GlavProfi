// server/api/materials/index.post.ts
/**
 * Назначение: Создание новой записи материала/расхода
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @body { name: string, amount: number, type: 'incoming'|'outgoing', objectId: number, comment?, hasReceipt?, operationDate? }
 * @returns { Material } — созданная запись материала
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { materials } from '../../db/schema'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const body = await readBody(event)

  if (!body.name || !body.amount || !body.type || !body.objectId) {
    throw createError({ statusCode: 400, message: 'Недостающие обязательные поля' })
  }

  let operationDate = new Date()
  if (body.operationDate) {
    const parsedDate = new Date(body.operationDate)
    if (isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Некорректный формат даты' })
    }
    operationDate = parsedDate
  }

  await db.insert(materials).values({
    name: body.name,
    amount: body.amount,
    comment: body.comment || '',
    hasReceipt: body.hasReceipt || false,
    type: body.type,
    objectId: parseInt(body.objectId),
    operationDate
  })

  const [newMaterial] = await db.select().from(materials).orderBy(materials.id).limit(1)
  return newMaterial
})
