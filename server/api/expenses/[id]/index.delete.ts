// server/api/expenses/[id]/index.delete.ts
/**
 * Назначение: Удаление записи расхода + восстановление баланса контрагента (если тип "Работа")
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * Логика:
 * - Атомарно вычитаем сумму расхода из баланса контрагента через SQL
 * - Всё в одной транзакции: если удаление упадёт, откатится и update баланса
 * 
 * @param {string} id — ID расхода (из пути)
 * @returns { message: string, deleted: Expense & { amount: number } }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
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
  
  const expenseId = parseInt(id)

  // Получаем расход ПЕРЕД транзакцией (read-only)
  const [deleted] = await db.select().from(expenses).where(eq(expenses.id, expenseId))
  if (!deleted) throw createError({ statusCode: 404, message: 'Расход не найден' })

  // ✅ Всё в одной транзакции
  return await db.transaction(async (tx) => {
    // 🔄 1. Восстанавливаем баланс контрагента — ТОЛЬКО если это был тип "Работа"
    if (
      deleted.expenseType === 'Работа' &&
      deleted.contractorType &&
      deleted.contractorId
    ) {
      const ContractorModel = getContractorTable(deleted.contractorType as ContractorType)
      
      if (ContractorModel) {
        // ✅ Атомарное обновление через SQL (без чтения в JS)
        // При удалении расхода типа "Работа" — возвращаем сумму обратно в баланс
        await tx.update(ContractorModel)
          .set({ balance: sql`balance - ${deleted.amount}` })
          .where(eq(ContractorModel.id, deleted.contractorId))
      }
    }

    // 🗑️ 2. Удаляем запись расхода
    await tx.delete(expenses).where(eq(expenses.id, expenseId))

    return {
      message: 'Расход успешно удален',
      deleted: { ...deleted, amount: Number(deleted.amount) }
    }
  })
})
