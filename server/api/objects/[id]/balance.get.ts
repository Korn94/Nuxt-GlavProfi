// server/api/objects/balance/[id].get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings, works, objects } from '../../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID объекта обязателен' })
  }

  try {
    // Получаем объект по ID
    const [object] = await db.select().from(objects).where(eq(objects.id, parseInt(id)))
    if (!object) {
      throw createError({ statusCode: 404, message: 'Объект не найден' })
    }

    // Получаем приходы по объекту
    const comingsList = await db.select().from(comings).where(eq(comings.objectId, parseInt(id)))

    // Получаем только оплаченные работы
    const paidWorksList = await db.select()
      .from(works)
      .where(
        and(
          eq(works.objectId, parseInt(id)),
          eq(works.paid, true)
        )
      )

    // Считаем итоги
    const totalIncome = comingsList.reduce((sum, c) => sum + Number(c.amount), 0)
    const totalWorks = paidWorksList.reduce((sum, w) => sum + Number(w.workerAmount), 0)
    const totalBalance = totalIncome - totalWorks

    return {
      objectId: object.id,
      name: object.name,
      totalIncome: totalIncome.toFixed(2),
      totalWorks: totalWorks.toFixed(2),
      totalBalance: totalBalance.toFixed(2)
    }
  } catch (error) {
    console.error('Ошибка расчёта баланса:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при расчёте баланса' })
  }
})
