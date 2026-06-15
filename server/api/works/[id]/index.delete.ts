// server/api/works/[id].delete.ts
/**
 * Назначение: Удаление работы + восстановление балансов контрагента и объекта
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * Логика:
 * - Баланс контрагента возвращается ТОЛЬКО если работа была принята (paid = true)
 * - Агрегаты объекта корректируются ТОЛЬКО при paid = true
 * - Всё в одной транзакции с атомарными SQL-обновлениями
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

  // Получаем работу ПЕРЕД транзакцией (read-only)
  const [deletedWork] = await db.select().from(works).where(eq(works.id, workId))
  if (!deletedWork) throw createError({ statusCode: 404, message: 'Работа не найдена' })

  // ✅ Все изменения в одной транзакции
  return await db.transaction(async (tx) => {
    // 🔄 1. Восстанавливаем баланс контрагента — ТОЛЬКО если работа была принята (paid = true)
    if (
      deletedWork.paid &&
      deletedWork.contractorType &&
      deletedWork.contractorId
    ) {
      const ContractorModel =
        deletedWork.contractorType === 'master' ? masters :
        deletedWork.contractorType === 'worker' ? workers : null

      if (ContractorModel) {
        // ✅ Атомарное обновление: SQL сам прибавит к текущему балансу
        await tx.update(ContractorModel)
          .set({ balance: sql`balance + ${deletedWork.workerAmount}` })
          .where(eq(ContractorModel.id, deletedWork.contractorId))
      }
    }

    // 🔄 2. Обновляем агрегаты объекта — ТОЛЬКО если работа была принята (paid = true)
    if (deletedWork.paid && deletedWork.objectId) {
      // ✅ Атомарное обновление через SQL (без чтения в JS)
      // GREATEST(0, ...) защита от ухода в минус при рассинхроне данных
      await tx.update(objects)
        .set({
          totalWorks: sql`GREATEST(0, total_works - ${deletedWork.workerAmount})`,
          totalBalance: sql`total_income - GREATEST(0, total_works - ${deletedWork.workerAmount})`
        })
        .where(eq(objects.id, deletedWork.objectId))
    }

    // 🗑️ 3. Удаляем запись работы
    await tx.delete(works).where(eq(works.id, workId))

    return {
      message: 'Работа успешно удалена',
      deletedWork
    }
  })
})
