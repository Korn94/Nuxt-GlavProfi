// server/api/objects/invoices/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { objectInvoices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const invoiceId = Number(getRouterParam(event, 'id'))
  if (isNaN(invoiceId)) throw createError({ statusCode: 400, message: 'Неверный ID счёта' })

  const body = await readBody(event)
  const { name, amount, comment, status, subtype } = body

  const updateData: any = {}
  let hasChanges = false

  if (name !== undefined && name !== null) {
    updateData.name = name
    hasChanges = true
  }

  if (amount !== undefined && amount !== null) {
    const parsedAmount = parseFloat(String(amount))
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      throw createError({ statusCode: 400, message: 'Сумма должна быть положительным числом' })
    }
    updateData.amount = parsedAmount.toFixed(2)
    hasChanges = true
  }

  if (comment !== undefined) {
    updateData.comment = comment === '' ? null : comment
    hasChanges = true
  }

  if (status !== undefined && ['prepared', 'sent', 'paid'].includes(status)) {
    updateData.status = status
    updateData.statusDate = new Date().toISOString().slice(0, 19).replace('T', ' ')
    hasChanges = true
  }

  if (subtype !== undefined) {
    if (!['advance', 'intermediate', 'final', 'additional'].includes(subtype)) {
      throw createError({ statusCode: 400, message: 'Недопустимый подтип счёта' })
    }
    updateData.subtype = subtype
    hasChanges = true
  }

  if (!hasChanges) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  try {
    await db
      .update(objectInvoices)
      .set(updateData)
      .where(eq(objectInvoices.id, invoiceId))

    const [updated] = await db
      .select()
      .from(objectInvoices)
      .where(eq(objectInvoices.id, invoiceId))

    if (!updated) {
      throw createError({ statusCode: 404, message: 'Счёт не найден' })
    }

    return {
      ...updated,
      amount: parseFloat(updated.amount)
    }
  } catch (rawError) {
    console.error('Ошибка обновления счёта:', rawError)

    const errorMessage = getErrorMessage(rawError)

    if (
      errorMessage.includes('column') ||
      errorMessage.includes('value') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('incorrect') ||
      errorMessage.includes('data too long')
    ) {
      throw createError({ statusCode: 400, message: 'Некорректное значение поля' })
    }

    throw createError({ statusCode: 500, message: 'Ошибка сервера при обновлении счёта' })
  }
})

// Вспомогательная функция
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message)
  }
  return String(error)
}
