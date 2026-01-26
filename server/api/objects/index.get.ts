// server/api/objects.get.ts
import { createError, defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'

// Таблицы
import {
  objects,
  objectContracts,
  objectInvoices,
  objectActs,
  materials as materialsTable
} from '../../db/schema'

// Операторы Drizzle
import { eq, and, like } from 'drizzle-orm'

// Утилита для расчёта
import { calculateObjectFinance } from '../../utils/calculateObjectFinance'

// Разрешённые статусы
const VALID_STATUSES = ['active', 'waiting', 'completed', 'canceled'] as const
type ObjectStatus = typeof VALID_STATUSES[number]

function isValidStatus(status: string): status is ObjectStatus {
  return VALID_STATUSES.includes(status as ObjectStatus)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search?.toString() || ''
  const statusParam = query.status?.toString()

  let whereClause = undefined

  // Фильтр по названию
  if (search) {
    whereClause = like(objects.name, `%${search}%`)
  }

  // Фильтр по статусу
  if (statusParam && isValidStatus(statusParam)) {
    whereClause = whereClause
      ? and(whereClause, eq(objects.status, statusParam))
      : eq(objects.status, statusParam)
  }

  try {
    // Основной запрос: объекты + договоры
    const objectsWithContracts = await db
      .select({
        object: objects,
        contract: objectContracts
      })
      .from(objects)
      .leftJoin(objectContracts, eq(objects.id, objectContracts.objectId))
      .where(whereClause)

    // Агрегация данных по каждому объекту
    const enhancedObjects = await Promise.all(
      objectsWithContracts.map(async (item) => {
        const obj = item.object

        // --- 1. Счета ---
        const invoices = await db
          .select({ id: objectInvoices.id, status: objectInvoices.status })
          .from(objectInvoices)
          .where(eq(objectInvoices.objectId, obj.id))

        const totalInvoices = invoices.length
        const signedInvoices = invoices.filter(inv => inv.status === 'paid').length

        // --- 2. Акты ---
        const acts = await db
          .select({ id: objectActs.id, status: objectActs.status })
          .from(objectActs)
          .where(eq(objectActs.objectId, obj.id))

        const totalActs = acts.length
        const signedActs = acts.filter(act => act.status === 'signed').length

        // --- 3. Материалы ---
        const materialsList = await db
          .select({
            type: materialsTable.type,
            amount: materialsTable.amount
          })
          .from(materialsTable)
          .where(eq(materialsTable.objectId, obj.id))

        const materialIncoming = materialsList
          .filter(m => m.type === 'incoming')
          .reduce((sum, m) => sum + (Number(m.amount) || 0), 0)

        const materialOutgoing = materialsList
          .filter(m => m.type === 'outgoing')
          .reduce((sum, m) => sum + (Number(m.amount) || 0), 0)

        // --- 4. Финансы из объекта ---
        const totalIncome = obj.totalIncome ? parseFloat(obj.totalIncome) : 0
        const totalWorks = obj.totalWorks ? parseFloat(obj.totalWorks) : 0

        // --- 5. Расчёт финасов ---
        const finance = calculateObjectFinance({
          totalIncome,
          totalWorks,
          materialIncoming,
          materialOutgoing
        })

        // --- 6. Формируем ответ ---
        return {
          ...obj,
          ...finance, // включает totalBalance, profit и т.д.

          // Договор
          contract: item.contract ? {
            id: item.contract.id,
            type: item.contract.type,
            status: item.contract.status
          } : null,

          // Статистика документов
          invoiceStats: { total: totalInvoices, signed: signedInvoices },
          actStats: { total: totalActs, signed: signedActs }
        }
      })
    )

    return enhancedObjects
  } catch (error) {
    console.error('Ошибка получения объектов:', error)
    throw createError({ statusCode: 500, message: 'Ошибка сервера при получении списка объектов' })
  }
})
