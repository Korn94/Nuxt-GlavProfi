// server/api/works/pay-work/[id].post.ts
/**
 * Назначение: Оплата работы + обновление балансов контрагента и объекта
 * ⚠️ Требует право `canViewSalary` (проверяется в мидлваре)
 * 
 * @param {string} id — ID работы (из пути)
 * @returns { Work } — обновлённая работа (`paid: true`, `paymentDate: now`)
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { works, masters, workers, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID работы обязателен' })

  const workId = parseInt(id)

  // Получаем работу
  const [work] = await db.select().from(works).where(eq(works.id, workId))
  if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })

  // Обновляем баланс контрагента (если применимо)
  if (work.contractorId && (work.contractorType === 'master' || work.contractorType === 'worker')) {
    const ContractorModel = work.contractorType === 'master' ? masters : workers
    
    const [contractor] = await db.select().from(ContractorModel)
      .where(eq(ContractorModel.id, work.contractorId))

    if (contractor) {
      const newBalance = Number(contractor.balance) - Number(work.workerAmount)
      await db.update(ContractorModel)
        .set({ balance: newBalance.toString() })
        .where(eq(ContractorModel.id, work.contractorId))
    }
  }

  // Обновляем статус оплаты работы
  await db.update(works)
    .set({ paid: true, paymentDate: new Date() })
    .where(eq(works.id, workId))

  // Обновляем агрегаты объекта
  const [object] = await db.select().from(objects).where(eq(objects.id, work.objectId))
  if (object) {
    const newTotalWorks = Number(object.totalWorks) + Number(work.workerAmount)
    const newTotalBalance = Number(object.totalIncome) - newTotalWorks

    await db.update(objects)
      .set({
        totalWorks: newTotalWorks.toFixed(2),
        totalBalance: newTotalBalance.toFixed(2)
      })
      .where(eq(objects.id, work.objectId))
  }

  // Возвращаем обновлённую работу (явно запрашиваем после всех изменений)
  const [updatedWork] = await db.select().from(works).where(eq(works.id, workId))
  return updatedWork || work
})
