// server/api/objects/[id]/full.get.ts
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'

// Таблицы
import {
  objects,
  foremans,
  comings,
  works,
  materials,
  objectBudget,
  objectInvoices,
  objectContracts // ← добавлено
} from '../../../db/schema'

import { eq, sum, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  try {
    // 1. Основной объект + прораб
    const [objectWithForeman] = await db
      .select({
        object: objects,
        foreman: foremans
      })
      .from(objects)
      .leftJoin(foremans, eq(objects.foremanId, foremans.id))
      .where(eq(objects.id, id))

    if (!objectWithForeman?.object) {
      throw createError({ statusCode: 404, message: 'Объект не найден' })
    }

    // 2. Финансы — отдельные запросы, чтобы избежать JOIN-дублей
    const [incomeResult] = await db
      .select({
        totalIncome: sum(comings.amount).mapWith(Number)
      })
      .from(comings)
      .where(eq(comings.objectId, id))

    const [worksResult] = await db
      .select({
        totalWorks: sum(works.workerAmount).mapWith(Number)
      })
      .from(works)
      .where(and(eq(works.objectId, id), eq(works.paid, true)))

    const totalIncome = Number(incomeResult?.totalIncome || 0)
    const totalWorks = Number(worksResult?.totalWorks || 0)
    const totalBalance = totalIncome - totalWorks

    // 3. Смета
    const budgetItems = await db
      .select()
      .from(objectBudget)
      .where(eq(objectBudget.objectId, id))
      .orderBy(objectBudget.order)

    // 4. Счета
    const invoices = await db
      .select()
      .from(objectInvoices)
      .where(eq(objectInvoices.objectId, id))
      .orderBy(objectInvoices.order)

    // 5. Договор
    const [contract] = await db
      .select()
      .from(objectContracts)
      .where(eq(objectContracts.objectId, id))

    // 6. Материалы
    const materialsList = await db
      .select()
      .from(materials)
      .where(eq(materials.objectId, id))

    // 7. Формируем финальный объект
    return {
      ...objectWithForeman.object,
      foreman: objectWithForeman.foreman,
      finances: { totalIncome, totalWorks, totalBalance },
      budget: budgetItems.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      })),
      invoices: invoices.map(inv => ({
        ...inv,
        amount: typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount
      })),
      contract: contract || null, // ← если нет договора — null
      materials: materialsList.map(m => ({
        ...m,
        amount: typeof m.amount === 'string' ? parseFloat(m.amount) : m.amount
      })),
      contractType: contract?.type || 'unassigned'
    }
  } catch (error) {
    console.error('Ошибка получения полных данных объекта:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при получении данных объекта' })
  }
})
