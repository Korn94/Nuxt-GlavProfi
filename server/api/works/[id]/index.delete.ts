// server/api/works/[id].delete.ts
/**
 * Назначение: Удаление работы + восстановление балансов контрагента и объекта
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID работы (из пути)
 * @returns { message: string, deletedWork: Work }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers, objects } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const workId = parseInt(id)
  const [deletedWork] = await db.select().from(works).where(eq(works.id, workId))
  if (!deletedWork) throw createError({ statusCode: 404, message: 'Работа не найдена' })

  // 🔄 Восстанавливаем баланс контрагента (возвращаем сумму)
  if (deletedWork.contractorType && deletedWork.contractorId) {
    const ContractorModel = 
      deletedWork.contractorType === 'master' ? masters : 
      deletedWork.contractorType === 'worker' ? workers : null

    if (ContractorModel) {
      await db.update(ContractorModel)
        .set({ 
          balance: sql`balance + ${deletedWork.workerAmount}` // Атомарное обновление
        })
        .where(eq(ContractorModel.id, deletedWork.contractorId))
    }
  }

  // 🔄 Обновляем агрегаты объекта ТОЛЬКО если работа была оплачена
  if (deletedWork.paid && deletedWork.objectId) {
    const [object] = await db.select().from(objects).where(eq(objects.id, deletedWork.objectId))
    
    if (object) {
      const totalWorks = Number(object.totalWorks ?? 0)
      const totalIncome = Number(object.totalIncome ?? 0)
      const workerAmount = Number(deletedWork.workerAmount ?? 0)
      
      const newTotalWorks = totalWorks - workerAmount
      const newTotalBalance = totalIncome - newTotalWorks
      
      await db.update(objects)
        .set({
          totalWorks: newTotalWorks.toFixed(2),
          totalBalance: newTotalBalance.toFixed(2)
        })
        .where(eq(objects.id, deletedWork.objectId))
    }
  }

  // 🗑️ Удаляем запись работы
  await db.delete(works).where(eq(works.id, workId))

  return {
    message: 'Работа успешно удалена',
    deletedWork
  }
})
