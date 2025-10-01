// server/api/objects/contract/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectContracts } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const contractId = Number(getRouterParam(event, 'id'))
  if (isNaN(contractId)) throw createError({ statusCode: 400, message: 'Неверный ID договора' })

  const body = await readBody(event)
  const { type, status, statusDate, comment } = body

  const updateData: any = {}
  let hasChanges = false

  // Тип договора
  if (type !== undefined && ['unassigned', 'none', 'edo', 'paper', 'invoice'].includes(type)) {
    updateData.type = type
    hasChanges = true
  }

  // Статус
  if (status !== undefined && ['prepared', 'sent', 'awaiting', 'signed', 'cancelled'].includes(status)) {
    updateData.status = status
    hasChanges = true
  }

  // Дата статуса
  if (statusDate !== undefined) {
    if (!statusDate) {
      updateData.statusDate = null
      hasChanges = true
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(statusDate)) {
      // Форматируем как строку для DATETIME в MySQL: 'YYYY-MM-DD 00:00:00'
      updateData.statusDate = `${statusDate} 00:00:00`
      hasChanges = true
    } else if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(statusDate)) {
      // Уже правильный формат строки — сохраняем как есть
      updateData.statusDate = statusDate
      hasChanges = true
    } else {
      throw createError({ statusCode: 400, message: 'Некорректный формат даты. Используйте YYYY-MM-DD' })
    }
  }

  // Комментарий
  if (comment !== undefined) {
    updateData.comment = comment === '' ? null : comment
    hasChanges = true
  }

  if (!hasChanges) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  // ✅ ВАЖНО: updatedAt должен быть объектом Date, т.к. в схеме стоит .$type<Date>()
  updateData.updatedAt = new Date()

  try {
    await db
      .update(objectContracts)
      .set(updateData)
      .where(eq(objectContracts.id, contractId))

    const [updated] = await db
      .select()
      .from(objectContracts)
      .where(eq(objectContracts.id, contractId))

    if (!updated) throw createError({ statusCode: 404, message: 'Договор не найден' })

    return updated
  } catch (error) {
    console.error('Ошибка обновления договора:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при обновлении договора' })
  }
})
