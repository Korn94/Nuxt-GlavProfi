// server/api/objects/[id]/full.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'

import {
  objects,
  foremans,
  comings,
  works,
  materials,
  objectBudget,
  objectInvoices,
  objectContracts,
  objectActs
} from '../../../db/schema'

import { eq, sum, and } from 'drizzle-orm'
import { calculateObjectFinance } from '../../../utils/calculateObjectFinance'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    const [objectWithForeman] = await db
      .select({ object: objects, foreman: foremans })
      .from(objects)
      .leftJoin(foremans, eq(objects.foremanId, foremans.id))
      .where(eq(objects.id, id))

    if (!objectWithForeman?.object) {
      throw createError({ statusCode: 404, message: 'Объект не найден' })
    }

    // Приход по счётам
    const [incomeResult] = await db
      .select({ totalIncome: sum(comings.amount).mapWith(Number) })
      .from(comings)
      .where(eq(comings.objectId, id))

    const [worksResult] = await db
      .select({ totalWorks: sum(works.workerAmount).mapWith(Number) })
      .from(works)
      .where(and(eq(works.objectId, id), eq(works.paid, true)))

    const totalIncome = Number(incomeResult?.totalIncome || 0)
    const totalWorks = Number(worksResult?.totalWorks || 0)

    // Материалы
    const materialsList = await db
      .select()
      .from(materials)
      .where(eq(materials.objectId, id))

    const materialIncoming = materialsList
      .filter(m => m.type === 'incoming')
      .reduce((sum, m) => sum + (typeof m.amount === 'string' ? parseFloat(m.amount) : m.amount), 0)

    const materialOutgoing = materialsList
      .filter(m => m.type === 'outgoing')
      .reduce((sum, m) => sum + (typeof m.amount === 'string' ? parseFloat(m.amount) : m.amount), 0)

    // Финансы
    const finance = calculateObjectFinance({
      totalIncome,
      totalWorks,
      materialIncoming,
      materialOutgoing
    })

    // Остальные данные...
    const budgetItems = await db.select().from(objectBudget).where(eq(objectBudget.objectId, id))
    const acts = await db.select().from(objectActs).where(eq(objectActs.objectId, id))
    const invoices = await db.select().from(objectInvoices).where(eq(objectInvoices.objectId, id))
    const [contract] = await db.select().from(objectContracts).where(eq(objectContracts.objectId, id))

    return {
      ...objectWithForeman.object,
      foreman: objectWithForeman.foreman,
      finances: {
        totalIncome,
        totalWorks,
        totalBalance: finance.totalBalance
      },
      materialIncoming,
      materialOutgoing,
      materialBalance: finance.materialBalance,
      
      // ✅ Исправлено: полные map()
      budget: budgetItems.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      })),
      invoices: invoices.map(inv => ({
        ...inv,
        amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount
      })),
      
      contract: contract || null,
      materials: materialsList.map(m => ({
        ...m,
        amount: typeof m.amount === 'string' ? parseFloat(m.amount) : m.amount
      })),
      contractType: contract?.type || 'unassigned',
      acts: acts.map(a => ({
        ...a,
        amount: typeof a.amount === 'string' ? parseFloat(a.amount) : a.amount
      }))
    }
  } catch (error) {
    console.error('Ошибка получения данных объекта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера' })
  }
})
