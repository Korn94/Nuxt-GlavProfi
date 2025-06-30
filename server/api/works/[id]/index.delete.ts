// server/api/works/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  try {
    const [deletedWork] = await db.select().from(works).where(eq(works.id, parseInt(id)))
    if (!deletedWork) throw createError({ statusCode: 404, message: 'Работа не найдена' })

    // Восстановление баланса контрагента
    if (deletedWork.contractorType && deletedWork.contractorId) {
      const ContractorModel = 
        deletedWork.contractorType === 'master' ? masters : 
        deletedWork.contractorType === 'worker' ? workers : null

      if (ContractorModel) {
        const [contractor] = await db.select().from(ContractorModel)
          .where(eq(ContractorModel.id, deletedWork.contractorId))

        if (contractor) {
          const contractorBalance = Number(contractor.balance)
          const workAmount = Number(deletedWork.workerAmount)
          const updatedBalance = contractorBalance - workAmount

          await db.update(ContractorModel)
            .set({ balance: updatedBalance.toString() })
            .where(eq(ContractorModel.id, deletedWork.contractorId))
        }
      }
    }

    // Удаление работы
    await db.delete(works).where(eq(works.id, parseInt(id)))

    return {
      message: 'Работа успешно удалена',
      deletedWork
    }
  } catch (error) {
    console.error('Ошибка удаления работы:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при удалении работы' 
    })
  }
})
