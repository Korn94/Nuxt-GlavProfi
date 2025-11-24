// server/api/works/[id].delete.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers, objects } from '../../../db/schema'
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
          const updatedBalance = contractorBalance + workAmount

          await db.update(ContractorModel)
            .set({ balance: updatedBalance.toString() })
            .where(eq(ContractorModel.id, deletedWork.contractorId))
        }
      }
    }

    // Обновляем totalWorks и totalBalance объекта ТОЛЬКО если работа была оплачена
    if (deletedWork.paid) {
      const objectResult = await db.select().from(objects).where(eq(objects.id, deletedWork.objectId))
      if (objectResult && objectResult.length > 0) {
        const currentObject = objectResult[0];
        
        if (!currentObject) {
          throw new Error('Object not found after selection');
        }
        
        const totalWorks = Number(currentObject.totalWorks ?? 0);
        const totalIncome = Number(currentObject.totalIncome ?? 0);
        const workerAmount = Number(deletedWork.workerAmount ?? 0);
        
        const newTotalWorks = totalWorks - workerAmount;
        const newTotalBalance = totalIncome - newTotalWorks;
        
        await db.update(objects)
          .set({
            totalWorks: newTotalWorks.toFixed(2),
            totalBalance: newTotalBalance.toFixed(2)
          })
          .where(eq(objects.id, deletedWork.objectId));
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
