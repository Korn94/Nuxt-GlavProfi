// server/api/objects.get.ts
/**
 * Назначение: Получение списка объектов с агрегацией финансов, договоров, актов, материалов
 * ⚠️ Требует право `canViewObjects` (проверяется в мидлваре)
 * 
 * @query { search?: string, status?: 'active'|'waiting'|'completed'|'canceled' }
 * @returns { Array<ObjectWithStats> } — объекты с договором, статистикой документов и рассчитанными финансами
 */

import { createError, defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { objects, objectContracts, objectInvoices, objectActs, materials as materialsTable } from '../../db/schema'
import { eq, and, like } from 'drizzle-orm'
import { calculateObjectFinance } from '../../utils/calculateObjectFinance'

const VALID_STATUSES = ['active', 'waiting', 'completed', 'canceled'] as const
type ObjectStatus = typeof VALID_STATUSES[number]

function isValidStatus(status: string): status is ObjectStatus {
  return VALID_STATUSES.includes(status as ObjectStatus)
}

export default defineEventHandler(async (event) => {
  // ✅ Авторизация и права уже проверены мидлваром
  const query = getQuery(event)
  const search = query.search?.toString() || ''
  const statusParam = query.status?.toString()

  let whereClause = undefined
  if (search) whereClause = like(objects.name, `%${search}%`)
  if (statusParam && isValidStatus(statusParam)) {
    whereClause = whereClause ? and(whereClause, eq(objects.status, statusParam)) : eq(objects.status, statusParam)
  }

  const objectsWithContracts = await db
    .select({ object: objects, contract: objectContracts })
    .from(objects)
    .leftJoin(objectContracts, eq(objects.id, objectContracts.objectId))
    .where(whereClause)

  const enhancedObjects = await Promise.all(
    objectsWithContracts.map(async (item) => {
      const obj = item.object

      // Счета
      const invoices = await db
        .select({ id: objectInvoices.id, status: objectInvoices.status })
        .from(objectInvoices)
        .where(eq(objectInvoices.objectId, obj.id))
      const totalInvoices = invoices.length
      const signedInvoices = invoices.filter(inv => inv.status === 'paid').length

      // Акты
      const acts = await db
        .select({ id: objectActs.id, status: objectActs.status })
        .from(objectActs)
        .where(eq(objectActs.objectId, obj.id))
      const totalActs = acts.length
      const signedActs = acts.filter(act => act.status === 'signed').length

      // Материалы
      const materialsList = await db
        .select({ type: materialsTable.type, amount: materialsTable.amount })
        .from(materialsTable)
        .where(eq(materialsTable.objectId, obj.id))
      const materialIncoming = materialsList.filter(m => m.type === 'incoming').reduce((sum, m) => sum + (Number(m.amount) || 0), 0)
      const materialOutgoing = materialsList.filter(m => m.type === 'outgoing').reduce((sum, m) => sum + (Number(m.amount) || 0), 0)

      // Финансы из объекта
      const totalIncome = obj.totalIncome ? parseFloat(obj.totalIncome) : 0
      const totalWorks = obj.totalWorks ? parseFloat(obj.totalWorks) : 0

      // Расчёт
      const finance = calculateObjectFinance({ totalIncome, totalWorks, materialIncoming, materialOutgoing })

      return {
        ...obj,
        ...finance,
        contract: item.contract ? { id: item.contract.id, type: item.contract.type, status: item.contract.status } : null,
        invoiceStats: { total: totalInvoices, signed: signedInvoices },
        actStats: { total: totalActs, signed: signedActs }
      }
    })
  )

  return enhancedObjects
})
