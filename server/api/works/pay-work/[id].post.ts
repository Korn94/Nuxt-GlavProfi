// server/api/works/pay-work/[id].post.ts
/**
 * Назначение: Оплата работы + обновление балансов контрагента и объекта
 * ⚠️ Требует право `canViewSalary` (проверяется в мидлваре)
 *
 * Логика:
 * - Атомарно вычитаем workerAmount из баланса контрагента
 * - Атомарно увеличиваем totalWorks объекта
 * - Атомарно пересчитываем totalBalance объекта
 * - Всё в одной транзакции
 *
 * @param {string} id — ID работы (из пути)
 * @returns { Work } — обновлённая работа (`paid: true`, `paymentDate: now`)
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

  // Получаем работу ПЕРЕД транзакцией (read-only)
  const [work] = await db.select().from(works).where(eq(works.id, workId))
  if (!work) throw createError({ statusCode: 404, message: 'Работа не найдена' })

  // Проверка: работа уже оплачена?
  if (work.paid) {
    throw createError({ statusCode: 400, message: 'Работа уже оплачена' })
  }

  // ✅ Всё в одной транзакции
  return await db.transaction(async (tx) => {
    // 1. Обновляем баланс контрагента (если применимо)
    if (work.contractorId && (work.contractorType === 'master' || work.contractorType === 'worker')) {
      const ContractorModel = work.contractorType === 'master' ? masters : workers
      
      // ✅ Атомарное обновление: SQL сам вычтет из текущего баланса
      await tx.update(ContractorModel)
        .set({ balance: sql`balance - ${work.workerAmount}` })
        .where(eq(ContractorModel.id, work.contractorId))
    }

    // 2. Обновляем статус оплаты работы
    await tx.update(works)
      .set({ paid: true, paymentDate: new Date() })
      .where(eq(works.id, workId))

    // 3. ✅ Атомарное обновление агрегатов объекта через SQL (без чтения в JS)
    if (work.objectId) {
      await tx.update(objects)
        .set({
          // totalWorks += workerAmount
          totalWorks: sql`total_works + ${work.workerAmount}`,
          // totalBalance = новый totalIncome - новый totalWorks
          // Так как totalIncome не меняется, а totalWorks увеличивается на workerAmount,
          // то totalBalance уменьшается на workerAmount
          totalBalance: sql`total_balance - ${work.workerAmount}`
        })
        .where(eq(objects.id, work.objectId))
    }

    // 4. Возвращаем обновлённую работу
    const [updatedWork] = await tx.select().from(works).where(eq(works.id, workId))
    return updatedWork || work
  })
})
