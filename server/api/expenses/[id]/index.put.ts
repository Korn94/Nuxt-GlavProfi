// server/api/expenses/[id]/index.put.ts
/**
 * Назначение: Обновление записи расхода + пересчёт баланса контрагента (если тип "Работа")
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * Логика баланса:
 * - Если сменился contractorId: у старого вычитаем, у нового прибавляем
 * - Если сменилась сумма: корректируем разницу
 * - Если сменился тип с "Работа" на другой: вычитаем всю старую сумму
 * - Если сменился тип с другого на "Работа": прибавляем всю новую сумму
 * 
 * @param {string} id — ID расхода (из пути)
 * @body { amount?, comment?, contractorId?, contractorType?, expenseType?, objectId?, paymentDate?, operationDate? }
 * @returns { Expense & { amount: number } } — обновлённая запись (с amount как number)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses, masters, workers, foremans, offices } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

type ContractorType = 'master' | 'worker' | 'foreman' | 'office'

const CONTRACTOR_TABLES = {
  master: masters,
  worker: workers,
  foreman: foremans,
  office: offices
} as const

function getContractorTable(type: ContractorType) {
  return CONTRACTOR_TABLES[type] || null
}

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })
  
  const body = await readBody(event)
  const expenseId = parseInt(id)

  // 1. Получаем ТЕКУЩУЮ запись (до изменений)
  const [currentExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId))
  if (!currentExpense) throw createError({ statusCode: 404, message: 'Расход не найден' })

  // 2. Собираем обновления только для переданных полей
  const updates: Record<string, any> = {}
  if (body.amount !== undefined) updates.amount = String(body.amount)
  if (body.comment !== undefined) updates.comment = body.comment
  if (body.contractorId !== undefined) updates.contractorId = body.contractorId
  if (body.contractorType !== undefined) updates.contractorType = body.contractorType
  if (body.expenseType !== undefined) updates.expenseType = body.expenseType
  if (body.objectId !== undefined) updates.objectId = body.objectId
  if (body.paymentDate !== undefined) updates.paymentDate = body.paymentDate
  if (body.operationDate !== undefined) {
    const parsedDate = new Date(body.operationDate)
    if (!isNaN(parsedDate.getTime())) updates.operationDate = parsedDate
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Нет данных для обновления' })
  }

  // ✅ ОДНА транзакция: обновление + корректировка баланса
  return await db.transaction(async (tx) => {
    // 3. Обновляем запись расхода
    await tx.update(expenses).set(updates).where(eq(expenses.id, expenseId))

    // 4. Получаем обновлённую запись
    const [updatedExpense] = await tx.select().from(expenses).where(eq(expenses.id, expenseId))
    if (!updatedExpense) throw createError({ statusCode: 404, message: 'Не удалось получить обновлённый расход' })

    // 5. 🔄 Пересчёт баланса контрагента (если хотя бы одно поле влияет на баланс)
    const wasWork = currentExpense.expenseType === 'Работа'
    const isWork = updatedExpense.expenseType === 'Работа'
    
    // Проверка: изменилось ли что-то, что влияет на баланс
    const contractorIdChanged = currentExpense.contractorId !== updatedExpense.contractorId
    const contractorTypeChanged = currentExpense.contractorType !== updatedExpense.contractorType
    const amountChanged = Number(currentExpense.amount) !== Number(updatedExpense.amount)
    const typeChanged = wasWork !== isWork

    const needsBalanceRecalc = (wasWork || isWork) && 
                                (contractorIdChanged || contractorTypeChanged || amountChanged || typeChanged)

    if (needsBalanceRecalc) {
      const oldAmount = Number(currentExpense.amount)
      const newAmount = Number(updatedExpense.amount)

      // ───────── СЛУЧАЙ 1: Сменился контрагент (или тип контрагента) ─────────
      if ((contractorIdChanged || contractorTypeChanged) && wasWork && isWork) {
        // У СТАРОГО контрагента вычитаем старую сумму
        if (currentExpense.contractorId && currentExpense.contractorType) {
          const OldModel = getContractorTable(currentExpense.contractorType as ContractorType)
          if (OldModel) {
            await tx.update(OldModel)
              .set({ balance: sql`balance - ${oldAmount}` })
              .where(eq(OldModel.id, currentExpense.contractorId))
          }
        }

        // У НОВОГО контрагента прибавляем новую сумму
        if (updatedExpense.contractorId && updatedExpense.contractorType) {
          const NewModel = getContractorTable(updatedExpense.contractorType as ContractorType)
          if (NewModel) {
            await tx.update(NewModel)
              .set({ balance: sql`balance + ${newAmount}` })
              .where(eq(NewModel.id, updatedExpense.contractorId))
          }
        }
      }
      // ───────── СЛУЧАЙ 2: Контрагент тот же, но изменилась сумма или тип ─────────
      else {
        // Определяем контрагента, чей баланс нужно корректировать
        const targetContractorId = updatedExpense.contractorId ?? currentExpense.contractorId
        const targetContractorType = updatedExpense.contractorType ?? currentExpense.contractorType

        if (targetContractorId && targetContractorType) {
          const ContractorModel = getContractorTable(targetContractorType as ContractorType)
          
          if (ContractorModel) {
            let balanceAdjustment = 0

            if (wasWork && isWork) {
              // Оба "Работа" — корректируем разницу
              balanceAdjustment = newAmount - oldAmount
            } else if (!wasWork && isWork) {
              // Был не "Работа", стал "Работа" — прибавляем всю новую сумму
              balanceAdjustment = newAmount
            } else if (wasWork && !isWork) {
              // Был "Работа", стал не "Работа" — вычитаем всю старую сумму
              balanceAdjustment = -oldAmount
            }

            if (balanceAdjustment !== 0) {
              // ✅ Атомарное обновление
              await tx.update(ContractorModel)
                .set({ balance: sql`balance + ${balanceAdjustment}` })
                .where(eq(ContractorModel.id, targetContractorId))
            }
          }
        }
      }
    }

    return { ...updatedExpense, amount: Number(updatedExpense.amount) }
  })
})
