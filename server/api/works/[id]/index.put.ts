/**
 * 📍 Файл: `server/api/works/[id].put.ts`
 * 📍 Эндпоинт: `PUT /api/works/[id]`
 *
 * Назначение: Обновление данных работы + пересчёт балансов контрагента И объекта
 * ⚠️ Требует право `canEditObjects` (проверяется в мидлваре)
 *
 * Логика:
 * - Читаем старую запись ПЕРЕД транзакцией (для расчёта diff)
 * - Парсим даты отдельно (строка → Date) для корректной работы с Drizzle
 * - Все изменения (работа + баланс контрагента + агрегаты объекта) в одной транзакции
 * - Атомарное обновление через SQL
 *
 * @param {string} id — ID работы (из пути)
 * @body { workerAmount?, comment?, contractorId?, contractorType?, workTypes?, foremanId?, paid?, paymentDate?, operationDate?, objectId? }
 * @returns { Work } — обновлённая запись работы
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers, objects } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const body = await readBody(event)
  const workId = parseInt(id)

  // ───────── СБОР ОБНОВЛЕНИЙ (с корректной обработкой дат) ─────────
  const updates: Record<string, any> = {}

  // Обычные поля
  const simpleFields = [
    'workerAmount', 'comment', 'contractorId', 'contractorType',
    'workTypes', 'foremanId', 'paid', 'objectId'
  ]
  for (const field of simpleFields) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  // 🔧 Отдельная обработка полей даты (парсинг строки в Date)
  if (body.operationDate !== undefined) {
    const parsedDate = new Date(body.operationDate)
    if (!isNaN(parsedDate.getTime())) {
      updates.operationDate = parsedDate
    } else {
      throw createError({ statusCode: 400, message: 'Некорректный формат operationDate' })
    }
  }
  if (body.paymentDate !== undefined) {
    if (body.paymentDate === null) {
      updates.paymentDate = null
    } else {
      const parsedDate = new Date(body.paymentDate)
      if (!isNaN(parsedDate.getTime())) {
        updates.paymentDate = parsedDate
      }
    }
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  // 🔍 Получаем ТЕКУЩУЮ запись ПЕРЕД транзакцией (read-only)
  const [currentWork] = await db.select().from(works).where(eq(works.id, workId))
  if (!currentWork) throw createError({ statusCode: 404, message: 'Работа не найдена' })

  // Сохраняем старые значения для пересчёта
  const oldAmount = Number(currentWork.workerAmount)
  const wasPaid = currentWork.paid
  const oldContractorId = currentWork.contractorId
  const oldContractorType = currentWork.contractorType
  const oldObjectId = currentWork.objectId

  // ✅ ОДНА транзакция: работа + баланс контрагента + агрегаты объекта
  return await db.transaction(async (tx) => {
    // 1. Обновляем запись работы
    await tx.update(works).set(updates).where(eq(works.id, workId))

    // 2. Получаем обновлённую запись
    const [updatedWork] = await tx.select().from(works).where(eq(works.id, workId))
    if (!updatedWork) throw createError({ statusCode: 500, message: 'Не удалось получить обновлённую работу' })

    const newAmount = Number(updatedWork.workerAmount)
    const isPaid = updatedWork.paid
    const newContractorId = updatedWork.contractorId
    const newContractorType = updatedWork.contractorType
    const newObjectId = updatedWork.objectId

    // ═══════════════════════════════════════════════════════════════
    // 🔄 ПЕРЕСЧЁТ БАЛАНСА КОНТРАГЕНТА
    // ═══════════════════════════════════════════════════════════════

    // СЛУЧАЙ 1: Сменился контрагент (при paid=true)
    if (
      isPaid &&
      (oldContractorId !== newContractorId || oldContractorType !== newContractorType)
    ) {
      // У СТАРОГО контрагента возвращаем старую сумму (если был paid)
      if (wasPaid && oldContractorId && oldContractorType) {
        const OldModel = oldContractorType === 'master' ? masters :
          oldContractorType === 'worker' ? workers : null
        if (OldModel) {
          await tx.update(OldModel)
            .set({ balance: sql`balance + ${oldAmount}` })
            .where(eq(OldModel.id, oldContractorId))
        }
      }
      // У НОВОГО контрагента вычитаем новую сумму
      if (newContractorId && newContractorType) {
        const NewModel = newContractorType === 'master' ? masters :
          newContractorType === 'worker' ? workers : null
        if (NewModel) {
          await tx.update(NewModel)
            .set({ balance: sql`balance - ${newAmount}` })
            .where(eq(NewModel.id, newContractorId))
        }
      }
    }
    // СЛУЧАЙ 2: Контрагент тот же, корректируем разницу
    else if (newContractorId && newContractorType) {
      const ContractorModel = newContractorType === 'master' ? masters :
        newContractorType === 'worker' ? workers : null
      if (ContractorModel) {
        let balanceAdjustment = 0
        if (!wasPaid && isPaid) {
          balanceAdjustment = -newAmount           // стала оплаченной
        } else if (wasPaid && !isPaid) {
          balanceAdjustment = oldAmount            // перестала быть оплаченной
        } else if (wasPaid && isPaid) {
          balanceAdjustment = -(newAmount - oldAmount) // изменилась сумма
        }
        if (balanceAdjustment !== 0) {
          await tx.update(ContractorModel)
            .set({ balance: sql`balance + ${balanceAdjustment}` })
            .where(eq(ContractorModel.id, newContractorId))
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 🔄 ПЕРЕСЧЁТ АГРЕГАТОВ ОБЪЕКТА (totalWorks, totalBalance)
    // ═══════════════════════════════════════════════════════════════

    // СЛУЧАЙ 1: Сменился объект у оплаченной работы
    if (
      isPaid &&
      oldObjectId &&
      newObjectId &&
      oldObjectId !== newObjectId
    ) {
      // У СТАРОГО объекта вычитаем (если работа была оплачена)
      if (wasPaid) {
        await tx.update(objects)
          .set({
            totalWorks: sql`GREATEST(0, total_works - ${oldAmount})`,
            totalBalance: sql`total_balance + ${oldAmount}`
          })
          .where(eq(objects.id, oldObjectId))
      }
      // У НОВОГО объекта прибавляем
      await tx.update(objects)
        .set({
          totalWorks: sql`total_works + ${newAmount}`,
          totalBalance: sql`total_balance - ${newAmount}`
        })
        .where(eq(objects.id, newObjectId))
    }
    // СЛУЧАЙ 2: Объект тот же, корректируем агрегаты
    else if (newObjectId) {
      let worksAdjustment = 0

      if (!wasPaid && isPaid) {
        // Стала оплаченной — прибавляем новую сумму к totalWorks
        worksAdjustment = newAmount
      } else if (wasPaid && !isPaid) {
        // Перестала быть оплаченной — вычитаем старую сумму из totalWorks
        worksAdjustment = -oldAmount
      } else if (wasPaid && isPaid && oldAmount !== newAmount) {
        // Остаётся оплаченной, но изменилась сумма — корректируем разницу
        worksAdjustment = newAmount - oldAmount
      }

      if (worksAdjustment !== 0) {
        // totalWorks += adjustment
        // totalBalance -= adjustment (т.к. totalBalance = totalIncome - totalWorks)
        await tx.update(objects)
          .set({
            totalWorks: sql`GREATEST(0, total_works + ${worksAdjustment})`,
            totalBalance: sql`total_balance - ${worksAdjustment}`
          })
          .where(eq(objects.id, newObjectId))
      }
    }

    return updatedWork
  })
})
