// server/api/objects/index.post.ts
/**
 * Назначение: Создание нового объекта строительства
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @body { name: string, status: 'active'|'waiting'|'completed'|'canceled' }
 * @returns { Object } — созданный объект (с авто-инициализацией балансов)
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { objects } from '../../db/schema'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const body = await readBody(event)

  if (!body.name || !body.status) {
    throw createError({ statusCode: 400, message: 'Название и статус обязательны' })
  }

  if (!['active', 'waiting', 'completed', 'canceled'].includes(body.status)) {
    throw createError({ statusCode: 400, message: 'Недопустимый статус объекта' })
  }

  await db.insert(objects).values({
    name: body.name,
    status: body.status,
    totalIncome: '0.00',
    totalWorks: '0.00',
    profit: '0.00',
    totalBalance: '0.00'
    // createdAt / updatedAt подставятся автоматически по default в схеме
  })

  const [newObject] = await db.select().from(objects).orderBy(objects.id).limit(1)
  return newObject
})
