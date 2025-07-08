// server/api/comings/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { comings, objects } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { amount, comment, objectId, operationDate } = body

    // Валидация обязательных полей
    if (!amount || !objectId) {
      throw createError({ 
        statusCode: 400,
        message: 'Сумма и ID объекта обязательны' 
      })
    }

    // Проверка формата даты операции
    let parsedDate = new Date()
    if (operationDate) {
      parsedDate = new Date(operationDate)
      if (isNaN(parsedDate.getTime())) {
        throw createError({ 
          statusCode: 400, 
          message: 'Некорректный формат даты операции' 
        })
      }
    }

    // Получаем текущий объект
    const [object] = await db.select().from(objects).where(eq(objects.id, parseInt(objectId)))
    if (!object) {
      throw createError({ statusCode: 404, message: 'Объект не найден' })
    }

    // Обновляем баланс объекта
    const updatedIncome = Number(object.totalIncome) + Number(amount)
    const updatedBalance = updatedIncome - Number(object.totalWorks)

    // Вставляем новый приход с указанной датой
    const [newComing] = await db.insert(comings).values({
      amount: amount.toString(),
      comment,
      objectId: parseInt(objectId),
      paymentDate: new Date(), // Текущая дата оплаты
      operationDate: parsedDate // Используем переданную дату
    }).$returningId()

    // Обновляем объект
    await db.update(objects).set({
      totalIncome: updatedIncome.toFixed(2),
      totalBalance: updatedBalance.toFixed(2)
    }).where(eq(objects.id, parseInt(objectId)))

    return newComing
  } catch (error) {
    console.error('Ошибка создания прихода:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при создании прихода' 
    })
  }
})
