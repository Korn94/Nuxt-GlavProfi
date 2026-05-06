// server/api/objects/[id]/contract.post.ts
/**
 * Назначение: Создание договора для объекта
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @body { type: 'edo'|'paper'|'invoice', status?: 'prepared', comment? }
 * @returns { Contract } — созданный договор (с авто-генерацией ID)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectContracts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

const VALID_TYPES = ['edo', 'paper', 'invoice'] as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const { type, status = 'prepared', comment } = body

  if (!type || !VALID_TYPES.includes(type as any)) {
    throw createError({ statusCode: 400, message: 'Укажите корректный тип договора' })
  }

  // Проверяем, нет ли уже договора у объекта
  const [existing] = await db.select().from(objectContracts).where(eq(objectContracts.objectId, id)).limit(1)
  if (existing) throw createError({ statusCode: 409, message: 'Договор уже существует' })

  const [newContract] = await db.insert(objectContracts).values({
    objectId: id,
    type,
    status,
    comment
  }).$returningId()

  return newContract
})
