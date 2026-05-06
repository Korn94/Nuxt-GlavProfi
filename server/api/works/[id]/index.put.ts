// server/api/works/[id].put.ts
/**
 * Назначение: Обновление данных работы + пересчёт баланса контрагента (если оплачена)
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID работы (из пути)
 * @body { workerAmount?, comment?, contractorId?, contractorType?, workTypes?, foremanId?, paid?, paymentDate?, operationDate?, objectId? }
 * @returns { Work } — обновлённая запись работы
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const body = await readBody(event)
  const workId = parseInt(id)

  // Собираем только переданные поля для обновления
  const updates: Record<string, any> = {}
  const updatableFields = [
    'workerAmount', 'comment', 'contractorId', 'contractorType',
    'workTypes', 'foremanId', 'paid', 'paymentDate', 'operationDate', 'objectId'
  ]
  for (const field of updatableFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  const [currentWork] = await db.select().from(works).where(eq(works.id, workId))
  if (!currentWork) throw createError({ statusCode: 404, message: 'Работа не найдена' })

  // Сохраняем старые значения для пересчёта баланса
  const oldAmount = Number(currentWork.workerAmount)
  const wasPaid = currentWork.paid

  // Обновляем запись работы
  await db.update(works).set(updates).where(eq(works.id, workId))

  // Получаем обновлённую запись
  const [updatedWork] = await db.select().from(works).where(eq(works.id, workId))
  if (!updatedWork) throw createError({ statusCode: 500, message: 'Не удалось получить обновлённую работу' })

  // 🔄 Пересчитываем баланс контрагента, если работа оплачена
  if (updatedWork.paid && updatedWork.contractorType && updatedWork.contractorId) {
    const ContractorModel = updatedWork.contractorType === 'master' ? masters :
                           updatedWork.contractorType === 'worker' ? workers : null

    if (ContractorModel) {
      const newAmount = Number(updatedWork.workerAmount)
      const diff = newAmount - oldAmount

      // Если статус оплаты изменился с "нет" на "да" — вычитаем полную сумму
      const amountToDeduct = !wasPaid && updatedWork.paid ? newAmount : diff

      await db.update(ContractorModel)
        .set({ 
          balance: sql`balance - ${amountToDeduct}` // Атомарное обновление на уровне БД
        })
        .where(eq(ContractorModel.id, updatedWork.contractorId))
    }
  }

  return updatedWork
})
