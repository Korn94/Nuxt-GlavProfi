// server/api/expenses/[id]/index.put.ts
/**
 * Назначение: Обновление записи расхода + пересчёт баланса контрагента (если тип "Работа")
 * ⚠️ Требует право `canEditFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID расхода (из пути)
 * @body { amount?, comment?, contractorId?, contractorType?, expenseType?, objectId?, paymentDate?, operationDate? }
 * @returns { Expense & { amount: number } } — обновлённая запись (с amount как number)
 */

import { defineEventHandler, readBody, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses, masters, workers, foremans, offices } from '../../../db/schema'
import { eq } from 'drizzle-orm'

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

  // 1. Получаем текущую запись
  const [currentExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId))
  if (!currentExpense) throw createError({ statusCode: 404, message: 'Расход не найден' })

  // 2. Собираем обновления
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

  // 3. Обновляем запись
  await db.update(expenses).set(updates).where(eq(expenses.id, expenseId))

  // 4. Получаем обновлённую запись
  const [updatedExpense] = await db.select().from(expenses).where(eq(expenses.id, expenseId))
  if (!updatedExpense) throw createError({ statusCode: 404, message: 'Не удалось получить обновлённый расход' })

  // 5. Пересчёт баланса контрагента — ТОЛЬКО для типа "Работа"
  if (
    updatedExpense.expenseType === 'Работа' &&
    updatedExpense.contractorType &&
    updatedExpense.contractorId
  ) {
    const ContractorModel = getContractorTable(updatedExpense.contractorType as ContractorType)
    
    if (ContractorModel) {
      const [contractor] = await db.select()
        .from(ContractorModel)
        .where(eq(ContractorModel.id, updatedExpense.contractorId))

      if (contractor) {
        const oldAmount = Number(currentExpense.amount)
        const newAmount = Number(updatedExpense.amount)
        const oldType = currentExpense.expenseType
        const newType = updatedExpense.expenseType
        
        let balanceAdjustment = 0
        
        if (oldType === 'Работа' && newType === 'Работа') {
          balanceAdjustment = newAmount - oldAmount
        } else if (oldType !== 'Работа' && newType === 'Работа') {
          balanceAdjustment = newAmount
        } else if (oldType === 'Работа' && newType !== 'Работа') {
          balanceAdjustment = -oldAmount
        }
        
        if (balanceAdjustment !== 0) {
          const newBalance = Number(contractor.balance) + balanceAdjustment
          await db.update(ContractorModel)
            .set({ balance: newBalance.toFixed(2) })
            .where(eq(ContractorModel.id, updatedExpense.contractorId))
        }
      }
    }
  }

  return { ...updatedExpense, amount: Number(updatedExpense.amount) }
})
