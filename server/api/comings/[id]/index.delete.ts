// server/api/comings/[id]/index.delete.ts
/**
 * Назначение: Удаление записи прихода + восстановление баланса объекта
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * Логика:
 * - Атомарно вычитаем сумму прихода из totalIncome через SQL
 * - Пересчитываем totalBalance = новый totalIncome - totalWorks
 * - Всё в одной транзакции: если удаление упадёт, откатится и update
 * 
 * @param {string} id — ID прихода (из пути)
 * @returns { message: string, deletedComing: Coming }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings, objects } from '../../../db/schema'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID прихода обязателен' })
  
  const comingId = parseInt(id)

  // Получаем приход ПЕРЕД транзакцией (read-only)
  const [deletedComing] = await db.select().from(comings).where(eq(comings.id, comingId))
  if (!deletedComing) throw createError({ statusCode: 404, message: 'Приход не найден' })

  // ✅ Всё в одной транзакции
  return await db.transaction(async (tx) => {
    // 🔄 1. Восстанавливаем баланс объекта: вычитаем сумму прихода из totalIncome
    if (deletedComing.objectId) {
      // ✅ Атомарное обновление через SQL (без чтения в JS)
      // GREATEST(0, ...) защита от ухода в минус при рассинхроне данных
      await tx.update(objects)
        .set({
          totalIncome: sql`GREATEST(0, total_income - ${deletedComing.amount})`,
          totalBalance: sql`GREATEST(0, total_income - ${deletedComing.amount}) - total_works`
        })
        .where(eq(objects.id, deletedComing.objectId))
    }

    // 🗑️ 2. Удаляем запись прихода
    await tx.delete(comings).where(eq(comings.id, comingId))

    return { message: 'Приход успешно удален', deletedComing }
  })
})
