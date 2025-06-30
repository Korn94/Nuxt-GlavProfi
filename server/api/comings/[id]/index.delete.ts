// server/api/comings/[id].delete.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { comings, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw new Error('ID прихода обязателен')

  try {
    const [deletedComing] = await db.select().from(comings).where(eq(comings.id, parseInt(id)))
    if (!deletedComing) throw new Error('Приход не найден')

    // Восстановление баланса объекта
    if (deletedComing.objectId) {
      const [object] = await db.select().from(objects).where(eq(objects.id, deletedComing.objectId))
      if (object) {
        const currentIncome = Number(object.totalIncome)
        const comingAmount = Number(deletedComing.amount)

        const updatedIncome = currentIncome - comingAmount

        await db.update(objects)
          .set({ totalIncome: updatedIncome.toString() })
          .where(eq(objects.id, deletedComing.objectId))
      }
    }

    await db.delete(comings).where(eq(comings.id, parseInt(id)))

    return {
      message: 'Приход успешно удален',
      deletedComing
    }
  } catch (error) {
    throw new Error('Ошибка сервера при удалении прихода')
  }
})
