// server/api/objects/contract/[id].put.ts
/**
 * Назначение: Обновление данных договора объекта (тип, статус, дата, комментарий)
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID договора (из пути)
 * @body { type?, status?, statusDate?, comment? }
 * @returns { Contract } — обновлённый договор
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectContracts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

const VALID_TYPES = ['unassigned', 'none', 'edo', 'paper', 'invoice'] as const
const VALID_STATUSES = ['prepared', 'sent', 'awaiting', 'signed', 'cancelled'] as const

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const contractId = Number(getRouterParam(event, 'id'))
  if (isNaN(contractId)) throw createError({ statusCode: 400, message: 'Неверный ID договора' })

  const body = await readBody(event)
  const { type, status, statusDate, comment } = body

  const updateData: Record<string, any> = {}
  let hasChanges = false

  if (type !== undefined && VALID_TYPES.includes(type as any)) { updateData.type = type; hasChanges = true }

  if (status !== undefined && VALID_STATUSES.includes(status as any)) { updateData.status = status; hasChanges = true }

  if (statusDate !== undefined) {
    if (!statusDate) {
      updateData.statusDate = null
      hasChanges = true
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(statusDate)) {
      updateData.statusDate = `${statusDate} 00:00:00`
      hasChanges = true
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(statusDate)) {
      updateData.statusDate = statusDate
      hasChanges = true
    } else {
      throw createError({ statusCode: 400, message: 'Некорректный формат даты' })
    }
  }

  if (comment !== undefined) { updateData.comment = comment === '' ? null : comment; hasChanges = true }

  if (!hasChanges) throw createError({ statusCode: 400, message: 'Нет данных для обновления' })

  // ✅ Автоматическое обновление поля updatedAt
  updateData.updatedAt = new Date()

  await db.update(objectContracts).set(updateData).where(eq(objectContracts.id, contractId))

  const [updated] = await db.select().from(objectContracts).where(eq(objectContracts.id, contractId))
  if (!updated) throw createError({ statusCode: 404, message: 'Договор не найден' })

  return updated
})
