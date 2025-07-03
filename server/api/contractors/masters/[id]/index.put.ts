// server/api/contractors/masters/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { masters } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID мастера обязателен' })

  try {
    const body = await readBody(event)
    
    // Проверка обязательных полей
    const updateFields = ['name', 'phone', 'comment', 'balance', 'userId', 'isOnSalary', 'salaryAmount', 'salaryDay']
    const hasUpdateData = updateFields.some(field => body[field] !== undefined)
    if (!hasUpdateData) {
      throw createError({ statusCode: 400, message: 'Не передано ни одно поле для обновления' })
    }

    // Подготовка обновлений
    const updates: any = {}
    if (body.name) updates.name = body.name
    if (body.phone) updates.phone = body.phone
    if (body.comment) updates.comment = body.comment
    if (body.balance !== undefined) updates.balance = body.balance
    if (body.userId !== undefined) updates.userId = body.userId
    if (body.isOnSalary !== undefined) updates.isOnSalary = body.isOnSalary
    if (body.salaryAmount !== undefined) updates.salaryAmount = body.salaryAmount
    if (body.salaryDay !== undefined) updates.salaryDay = body.salaryDay

    // Обновление мастера
    await db.update(masters).set(updates).where(eq(masters.id, parseInt(id)))

    // Возврат обновленного мастера
    const [updatedMaster] = await db.select().from(masters).where(eq(masters.id, parseInt(id)))
    if (!updatedMaster) {
      throw createError({ statusCode: 404, message: 'Мастер не найден' })
    }

    return updatedMaster
  } catch (error) {
    console.error('Ошибка обновления мастера:', error)
    if (error instanceof Error) {
      throw createError({ statusCode: 500, message: `Ошибка сервера: ${error.message}` })
    } else {
      throw createError({ statusCode: 500, message: 'Неизвестная ошибка' })
    }
  }
})
