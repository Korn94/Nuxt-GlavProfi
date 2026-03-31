// server/api/expenses/[id]/index.delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { 
  expenses, 
  masters, 
  workers, 
  foremans, 
  offices 
} from '../../../db/schema'
import { eq } from 'drizzle-orm'
import type { ContractorType } from '~/types/contractors'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    // 1. Получаем расход
    const [deleted] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id)))
    if (!deleted) throw createError({ statusCode: 404, message: 'Расход не найден' })

    // 2. Восстановление баланса контрагента — ТОЛЬКО если это был тип "Работа"
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
          // (контрагент снова должен нам эту сумму)
          const contractorBalance = Number(contractor.balance)
          const expenseAmount = Number(deleted.amount)
          const updatedBalance = contractorBalance - expenseAmount

          await db.update(ContractorModel)
            .set({ balance: updatedBalance.toFixed(2) })
            .where(eq(ContractorModel.id, deleted.contractorId))
        }
      }
    }

    // 3. Удаляем запись
    await db.delete(expenses).where(eq(expenses.id, parseInt(id)))

    return {
      message: 'Расход успешно удален',
      deleted: {
        ...deleted,
        amount: Number(deleted.amount)
      }
    }
  } catch (error) {
    console.error('Ошибка удаления расхода:', error)
    throw createError({ 
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Ошибка сервера при удалении расхода' 
    })
  }
})

// Вспомогательная функция для получения таблицы по типу контрагента
function getContractorTable(type: ContractorType) {
  const tables = {
    master: masters,
    worker: workers,
    foreman: foremans,
    office: offices
  }
  return tables[type] || null
}
