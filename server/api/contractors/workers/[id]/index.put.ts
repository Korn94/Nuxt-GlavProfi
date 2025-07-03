// server/api/contractors/workers/[id].put.ts
import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { workers } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID рабочего обязателен' })

  try {
    const body = await readBody(event)

    // Проверяем, что переданы какие-то данные для обновления
    const updateFields = [
      'name', 'phone', 'comment', 'balance', 'isNoName', 'worksCompleted', 
      'works', 'objectId', 'userId', 'isOnSalary', 'salaryAmount', 'salaryDay'
    ]
    const hasUpdateData = updateFields.some(field => body[field] !== undefined)
    
    if (!hasUpdateData) {
      throw createError({ 
        statusCode: 400, 
        message: 'Не передано ни одно поле для обновления' 
      })
    }

    // Подготавливаем обновления
    const updates: any = {}

    // Обновляем стандартные поля
    if (body.name !== undefined) updates.name = body.name
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.comment !== undefined) updates.comment = body.comment
    if (body.balance !== undefined) updates.balance = body.balance.toString()
    if (body.isNoName !== undefined) updates.isNoName = body.isNoName === true || body.isNoName === 'true'
    if (body.worksCompleted !== undefined) updates.worksCompleted = parseInt(body.worksCompleted)
    if (body.works !== undefined) updates.works = body.works
    if (body.objectId !== undefined) updates.objectId = parseInt(body.objectId)
    if (body.userId !== undefined) updates.userId = parseInt(body.userId)

    // Обновляем поля, связанные с автоматической зарплатой
    if (body.isOnSalary !== undefined) {
      updates.isOnSalary = body.isOnSalary === true || body.isOnSalary === 'true'
    }
    
    if (body.salaryAmount !== undefined) {
      const amount = parseFloat(body.salaryAmount)
      if (isNaN(amount) || amount < 0) {
        throw createError({ 
          statusCode: 400, 
          message: 'Зарплата должна быть положительным числом' 
        })
      }
      updates.salaryAmount = amount.toFixed(2)
    }
    
    if (body.salaryDay !== undefined) {
      const day = parseInt(body.salaryDay)
      if (isNaN(day) || day < 1 || day > 31) {
        throw createError({ 
          statusCode: 400, 
          message: 'День месяца должен быть от 1 до 31' 
        })
      }
      updates.salaryDay = day
    }

    // Выполняем обновление
    await db.update(workers)
      .set(updates)
      .where(eq(workers.id, parseInt(id)))

    // Получаем обновленную запись
    const [updatedWorker] = await db.select().from(workers)
      .where(eq(workers.id, parseInt(id)))
    
    if (!updatedWorker) {
      throw createError({ statusCode: 404, message: 'Рабочий не найден' })
    }

    return updatedWorker
  } catch (error) {
    console.error('Ошибка обновления рабочего:', error)
    
    // Типизация ошибки
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        message: `Ошибка сервера при обновлении рабочего: ${error.message}`
      })
    } else {
      throw createError({
        statusCode: 500,
        message: 'Неизвестная ошибка при обновлении рабочего'
      })
    }
  }
})
