// server/api/expenses/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../db'
import { expenses, workers, masters, objects, foremans, offices } from '../../db/schema'
import { and, eq, gte, lte, asc } from 'drizzle-orm'

// Допустимые типы контрагентов (должны совпадать с enum в базе данных)
const allowedTypes = ['master', 'worker', 'foreman', 'office'] as const
type ContractorType = typeof allowedTypes[number]

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filters = []

  try {
    // Фильтр по дате
    if (query.startDate) {
      const startDate = new Date(query.startDate as string)
      if (isNaN(startDate.getTime())) throw new Error('Неверный формат даты startDate')
      filters.push(gte(expenses.operationDate, startDate))
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate as string)
      if (isNaN(endDate.getTime())) throw new Error('Неверный формат даты endDate')
      filters.push(lte(expenses.operationDate, endDate))
    }

    // Фильтр по типу и ID контрагента
    if (query.contractorType) {
      if (!allowedTypes.includes(query.contractorType as ContractorType)) {
        throw new Error('Неверный тип контрагента')
      }
      filters.push(eq(expenses.contractorType, query.contractorType as ContractorType))
    }

    if (query.contractorId) {
      const contractorId = parseInt(query.contractorId as string)
      if (isNaN(contractorId)) throw new Error('contractorId должен быть числом')
      filters.push(eq(expenses.contractorId, contractorId))
    }

    // Выполняем запрос с фильтрами
    const result = await db
      .select({
        expense: expenses,
        worker: workers,
        master: masters,
        object: objects,
        foreman: foremans,
        office: offices
      })
      .from(expenses)
      .leftJoin(workers, eq(expenses.contractorId, workers.id))
      .leftJoin(masters, eq(expenses.contractorId, masters.id))
      .leftJoin(foremans, eq(expenses.contractorId, foremans.id))
      .leftJoin(offices, eq(expenses.contractorId, offices.id))
      .leftJoin(objects, eq(expenses.objectId, objects.id))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(asc(expenses.operationDate))

    // Формируем результат с именами контрагентов
    return result.map(({ expense, worker, master, foreman, office, object }) => ({
      ...expense,
      contractorName: expense.contractorType === 'worker'
        ? worker?.name || 'Неизвестный рабочий'
        : expense.contractorType === 'master'
          ? master?.name || 'Неизвестный мастер'
          : expense.contractorType === 'foreman'
            ? foreman?.name || 'Неизвестный прораб'
            : office?.name || 'Неизвестный офис',
      objectName: object?.name || 'Без объекта'
    }))
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Ошибка фильтрации данных'
    })
  }
})
