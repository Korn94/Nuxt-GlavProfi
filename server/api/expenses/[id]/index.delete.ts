// server/api/expenses/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { expenses, masters, workers } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID обязателен' })

  try {
    const [deleted] = await db.select().from(expenses).where(eq(expenses.id, parseInt(id)))
    if (!deleted) throw createError({ statusCode: 404, message: 'Расход не найден' })

    // Восстановление баланса контрагента
    if (deleted.contractorType && deleted.contractorId) {
      const ContractorModel = 
        deleted.contractorType === 'master' ? masters :
        deleted.contractorType === 'worker' ? workers : null

      if (ContractorModel) {
        const [contractor] = await db.select()
          .from(ContractorModel)
          .where(eq(ContractorModel.id, deleted.contractorId))

        if (contractor) {
          const contractorBalance = Number(contractor.balance)
          const expenseAmount = Number(deleted.amount)
          const updatedBalance = contractorBalance - expenseAmount

          await db.update(ContractorModel)
            .set({ balance: updatedBalance.toString() })
            .where(eq(ContractorModel.id, deleted.contractorId))
        }
      }
    }

    await db.delete(expenses).where(eq(expenses.id, parseInt(id)))

    return {
      message: 'Расход успешно удален',
      deleted
    }
  } catch (error) {
    console.error('Ошибка удаления расхода:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при удалении расхода' 
    })
  }
})
