// server/api/comings/index.post.ts
/**
 * Назначение: Создание новой записи прихода (поступления средств) на объект
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @body { amount: number, objectId: number, comment?, operationDate? }
 * @returns { Coming } — созданная запись прихода
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { comings, objects } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const body = await readBody(event)
  const { amount, comment, objectId, operationDate } = body

  // Валидация обязательных полей
  if (!amount || !objectId) {
    throw createError({ statusCode: 400, message: 'Сумма и ID объекта обязательны' })
  }

  // Проверка и парсинг даты операции
  let parsedDate = new Date()
  if (operationDate) {
    parsedDate = new Date(operationDate)
    if (isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Некорректный формат даты' })
    }
  }

  // Проверка существования объекта
  const [object] = await db.select().from(objects).where(eq(objects.id, parseInt(objectId)))
  if (!object) throw createError({ statusCode: 404, message: 'Объект не найден' })

  // Пересчёт финансов объекта
  const updatedIncome = Number(object.totalIncome) + Number(amount)
  const updatedBalance = updatedIncome - Number(object.totalWorks)

  // Создание записи прихода
  const [newComing] = await db.insert(comings).values({
    amount: amount.toString(),
    comment,
    objectId: parseInt(objectId),
    operationDate: parsedDate
  }).$returningId()

  // Обновление агрегатов объекта
  await db.update(objects).set({
    totalIncome: updatedIncome.toFixed(2),
    totalBalance: updatedBalance.toFixed(2)
  }).where(eq(objects.id, parseInt(objectId)))

  return newComing
})
