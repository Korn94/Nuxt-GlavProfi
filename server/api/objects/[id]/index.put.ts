// server/api/objects/[id].put.ts
/**
 * Назначение: Обновление данных объекта строительства
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @body { name?, status?, address?, startDate?, plannedEndDate?, completedDate?, source?, contractType?, comment?, foremanId? }
 * @returns { Object } — обновлённый объект
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const body = await readBody(event)
  const [currentObject] = await db.select().from(objects).where(eq(objects.id, id))
  if (!currentObject) throw createError({ statusCode: 404, message: 'Объект не найден' })

  const updates: Record<string, any> = {}
  if (body.name !== undefined) updates.name = body.name
  
  if (body.status !== undefined && body.status !== currentObject.status) {
    updates.status = body.status
    updates.statusDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
  }
  
  if (body.address !== undefined) updates.address = body.address
  if (body.startDate !== undefined) updates.startDate = body.startDate
  if (body.plannedEndDate !== undefined) updates.plannedEndDate = body.plannedEndDate
  if (body.completedDate !== undefined) updates.completedDate = body.completedDate
  if (body.source !== undefined) updates.source = body.source
  if (body.contractType !== undefined) updates.contractType = body.contractType
  if (body.comment !== undefined) updates.comment = body.comment
  if (body.foremanId !== undefined) updates.foremanId = body.foremanId === null ? null : Number(body.foremanId)

  if (Object.keys(updates).length === 0) throw createError({ statusCode: 400, message: 'Нет данных для обновления' })

  updates.updatedAt = new Date()

  await db.update(objects).set(updates).where(eq(objects.id, id))

  const [updated] = await db.select().from(objects).where(eq(objects.id, id))
  if (!updated) throw createError({ statusCode: 404, message: 'Объект не найден' })

  return updated
})
