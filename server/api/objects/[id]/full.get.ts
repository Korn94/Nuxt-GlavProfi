// server/api/objects/[id]/full.get.ts
/**
 * Назначение: Получение полных данных объекта (финансы, материалы, документы, смета)
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @param {string} id — ID объекта (из пути)
 * @returns { ObjectFull } — объект со всеми связанными данными и рассчитанными финансами
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../db'
import {
  objects, foremans, comings, works, materials,
  objectBudget, objectInvoices, objectContracts, objectActs
} from '../../../db/schema'
import { eq, and, sum } from 'drizzle-orm'
import { calculateObjectFinance } from '../../../utils/calculateObjectFinance'

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const id = Number(getRouterParam(event, 'id'))
  if (isNaN(id)) throw createError({ statusCode: 400, message: 'Неверный ID' })

  const [objectWithForeman] = await db
    .select({ object: objects, foreman: foremans })
    .from(objects)
    .leftJoin(foremans, eq(objects.foremanId, foremans.id))
    .where(eq(objects.id, id))

  if (!objectWithForeman?.object) throw createError({ statusCode: 404, message: 'Объект не найден' })

  // Агрегация: приходы
  const [incomeResult] = await db
    .select({ totalIncome: sum(comings.amount).mapWith(Number) })
    .from(comings)
    .where(eq(comings.objectId, id))

  // Агрегация: оплаченные работы
  const [worksResult] = await db
    .select({ totalWorks: sum(works.workerAmount).mapWith(Number) })
    .from(works)
    .where(and(eq(works.objectId, id), eq(works.paid, true)))

  const totalIncome = Number(incomeResult?.totalIncome || 0)
  const totalWorks = Number(worksResult?.totalWorks || 0)

  // Материалы
  const materialsList = await db.select().from(materials).where(eq(materials.objectId, id))
  const materialIncoming = materialsList.filter(m => m.type === 'incoming').reduce((s, m) => s + (typeof m.amount === 'string' ? parseFloat(m.amount) : m.amount), 0)
  const materialOutgoing = materialsList.filter(m => m.type === 'outgoing').reduce((s, m) => s + (typeof m.amount === 'string' ? parseFloat(m.amount) : m.amount), 0)

  // Расчёт финансов
  const finance = calculateObjectFinance({ totalIncome, totalWorks, materialIncoming, materialOutgoing })

  // Связанные данные
  const budgetItems = await db.select().from(objectBudget).where(eq(objectBudget.objectId, id))
  const acts = await db.select().from(objectActs).where(eq(objectActs.objectId, id))
  const invoices = await db.select().from(objectInvoices).where(eq(objectInvoices.objectId, id))
  const [contract] = await db.select().from(objectContracts).where(eq(objectContracts.objectId, id))

  // Хелпер для конвертации amount
  const withAmount = <T extends { amount?: string | number }>(items: T[]) =>
    items.map(i => ({ ...i, amount: typeof i.amount === 'string' ? parseFloat(i.amount) : i.amount }))

  return {
    ...objectWithForeman.object,
    foreman: objectWithForeman.foreman,
    finances: { totalIncome, totalWorks, totalBalance: finance.totalBalance },
    materialIncoming,
    materialOutgoing,
    materialBalance: finance.materialBalance,
    budget: withAmount(budgetItems),
    invoices: withAmount(invoices),
    contract: contract || null,
    materials: withAmount(materialsList),
    contractType: contract?.type || 'unassigned',
    acts: withAmount(acts)
  }
})
