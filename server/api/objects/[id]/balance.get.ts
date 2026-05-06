// server\api\objects\[id]\balance.get.ts
/**
 * Назначение: Расчёт финансового баланса объекта (приходы − оплаченные работы)
 * ⚠️ Требует право `canViewFinance` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { objectId: number, name: string, totalIncome: string, totalWorks: string, totalBalance: string }
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import { comings, works, objects } from '../../../db/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID объекта обязателен' })

  const [object] = await db.select().from(objects).where(eq(objects.id, parseInt(id)))
  if (!object) throw createError({ statusCode: 404, message: 'Объект не найден' })

  const comingsList = await db.select().from(comings).where(eq(comings.objectId, parseInt(id)))
  const paidWorksList = await db.select().from(works).where(and(eq(works.objectId, parseInt(id)), eq(works.paid, true)))

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
})