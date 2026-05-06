// server/api/comings/[id]/index.delete.ts
/**
 * Назначение: Удаление записи прихода + восстановление баланса объекта
 * ⚠️ Требует право `canDeleteRecords` (проверяется в мидлваре)
 * 
 * @param {string} id — ID прихода (из пути)
 * @returns { message: string, deletedComing: Coming }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID прихода обязателен' })

  const comingId = parseInt(id)
  const [deletedComing] = await db.select().from(comings).where(eq(comings.id, comingId))
  if (!deletedComing) throw createError({ statusCode: 404, message: 'Приход не найден' })

  // 🔄 Восстанавливаем баланс объекта: вычитаем сумму прихода из totalIncome
  if (deletedComing.objectId) {
    const [object] = await db.select().from(objects).where(eq(objects.id, deletedComing.objectId))
    
    if (object) {
      const updatedIncome = Number(object.totalIncome) - Number(deletedComing.amount)
      
      await db.update(objects)
        .set({ 
          totalIncome: updatedIncome.toFixed(2),
          totalBalance: (updatedIncome - Number(object.totalWorks)).toFixed(2)
        })
        .where(eq(objects.id, deletedComing.objectId))
    }
  }

  // 🗑️ Удаляем запись прихода
  await db.delete(comings).where(eq(comings.id, comingId))

  return { message: 'Приход успешно удален', deletedComing }
})
