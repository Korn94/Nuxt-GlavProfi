// server/api/expenses/[id]/index.delete.ts
/**
 * Назначение: Удаление записи расхода + восстановление баланса контрагента (если тип "Работа")
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID расхода (из пути)
 * @returns { message: string, deleted: Expense & { amount: number } }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
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

  const expenseId = parseInt(id)
  const [deleted] = await db.select().from(expenses).where(eq(expenses.id, expenseId))
  if (!deleted) throw createError({ statusCode: 404, message: 'Расход не найден' })

  // 🔄 Восстанавливаем баланс контрагента — ТОЛЬКО если это был тип "Работа"
  if (
    deleted.expenseType === 'Работа' &&
    deleted.contractorType &&
    deleted.contractorId
  ) {
    const ContractorModel = getContractorTable(deleted.contractorType as ContractorType)
    
    if (ContractorModel) {
      const [contractor] = await db.select()
        .from(ContractorModel)
        .where(eq(ContractorModel.id, deleted.contractorId))

      if (contractor) {
        // При удалении расхода типа "Работа" — возвращаем сумму обратно в баланс
        const newBalance = Number(contractor.balance) - Number(deleted.amount)
        
        await db.update(ContractorModel)
          .set({ balance: newBalance.toFixed(2) })
          .where(eq(ContractorModel.id, deleted.contractorId))
      }
    }
  }

  // 🗑️ Удаляем запись расхода
  await db.delete(expenses).where(eq(expenses.id, expenseId))

  return {
    message: 'Расход успешно удален',
    deleted: { ...deleted, amount: Number(deleted.amount) }
  }
})
