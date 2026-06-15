// server\api\comings\[id]\index.put.ts
/**
 * Назначение: Обновление записи прихода + пересчёт агрегатов объекта
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * Логика:
 * - Если сменился objectId: у старого вычитаем, у нового прибавляем
 * - Если сменилась сумма: корректируем разницу в totalIncome
 * - Всё в транзакции с атомарными обновлениями через SQL
 * 
 * @param {string} id — ID прихода (из пути)
 * @body { amount?, comment?, objectId?, operationDate? } — все поля опциональны
 * @returns { Coming } — обновлённая запись прихода
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings, objects } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID прихода обязателен' })
  
  const comingId = parseInt(id)
  const body = await readBody(event)
  const { amount, comment, objectId, operationDate } = body

  // 1. Получаем ТЕКУЩУЮ запись (до изменений)
  const [currentComing] = await db.select().from(comings).where(eq(comings.id, comingId))
  if (!currentComing) throw createError({ statusCode: 404, message: 'Приход не найден' })

  // 2. Собираем обновления только для переданных полей
  const updates: Record<string, any> = {}
  if (amount !== undefined) updates.amount = String(amount)
  if (comment !== undefined) updates.comment = comment
  if (objectId !== undefined) updates.objectId = parseInt(objectId)
  if (operationDate !== undefined) {
    const parsedDate = new Date(operationDate)
    if (isNaN(parsedDate.getTime())) {
      throw createError({ statusCode: 400, message: 'Некорректный формат даты' })
    }
    updates.operationDate = parsedDate
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  // ✅ ОДНА транзакция: обновление + корректировка агрегатов
  return await db.transaction(async (tx) => {
    // 3. Обновляем запись прихода
    await tx.update(comings).set(updates).where(eq(comings.id, comingId))

    // 4. Получаем обновлённую запись
    const [updatedComing] = await tx.select().from(comings).where(eq(comings.id, comingId))
    if (!updatedComing) throw createError({ statusCode: 404, message: 'Не удалось получить обновлённый приход' })

    // 5. 🔄 Пересчёт агрегатов объекта
    const oldAmount = Number(currentComing.amount)
    const newAmount = Number(updatedComing.amount)
    const oldObjectId = currentComing.objectId
    const newObjectId = updatedComing.objectId

    const objectIdChanged = oldObjectId !== newObjectId
    const amountChanged = oldAmount !== newAmount

    // ───────── СЛУЧАЙ 1: Сменился объект ─────────
    if (objectIdChanged) {
      // У СТАРОГО объекта вычитаем старую сумму
      if (oldObjectId) {
        await tx.update(objects)
          .set({
            totalIncome: sql`GREATEST(0, total_income - ${oldAmount})`,
            totalBalance: sql`(GREATEST(0, total_income - ${oldAmount})) - total_works`
          })
          .where(eq(objects.id, oldObjectId))
      }

      // У НОВОГО объекта прибавляем новую сумму
      if (newObjectId) {
        await tx.update(objects)
          .set({
            totalIncome: sql`total_income + ${newAmount}`,
            totalBalance: sql`(total_income + ${newAmount}) - total_works`
          })
          .where(eq(objects.id, newObjectId))
      }
    }
    // ───────── СЛУЧАЙ 2: Объект тот же, но изменилась сумма ─────────
    else if (amountChanged && newObjectId) {
      const diff = newAmount - oldAmount

      // ✅ Атомарное обновление totalIncome и totalBalance
      await tx.update(objects)
        .set({
          totalIncome: sql`total_income + ${diff}`,
          totalBalance: sql`(total_income + ${diff}) - total_works`
        })
        .where(eq(objects.id, newObjectId))
    }

    return updatedComing
  })
})
