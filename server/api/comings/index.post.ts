// server/api/comings/index.post.ts
/**
 * Назначение: Создание новой записи прихода (поступления средств) на объект
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * Логика:
 * - Создаём запись прихода
 * - Атомарно увеличиваем totalIncome объекта через SQL
 * - Автоматически пересчитываем totalBalance = totalIncome - totalWorks
 * 
 * @body { amount: number, objectId: number, comment?, operationDate? }
 * @returns { Coming } — созданная запись прихода
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { comings, objects } from '../../db/schema'
import { eq, sql } from 'drizzle-orm'

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

  // Проверка существования объекта (read-only, можно вне транзакции)
  const [object] = await db.select().from(objects).where(eq(objects.id, parseInt(objectId)))
  if (!object) throw createError({ statusCode: 404, message: 'Объект не найден' })

  // ✅ Всё в одной транзакции
  return await db.transaction(async (tx) => {
    // 1. Создание записи прихода
    const [newComing] = await tx.insert(comings).values({
      amount: amount.toString(),
      comment,
      objectId: parseInt(objectId),
      operationDate: parsedDate
    }).$returningId()

    // 2. Атомарное обновление агрегатов объекта через SQL
    //    totalIncome += amount
    //    totalBalance = новый totalIncome - totalWorks
    await tx.update(objects)
      .set({
        totalIncome: sql`total_income + ${amount}`,
        totalBalance: sql`(total_income + ${amount}) - total_works`
      })
      .where(eq(objects.id, parseInt(objectId)))

    return newComing
  })
})
