// server/api/expenses/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../db'
import { expenses, workers, masters, objects } from '../../db/schema'
import { and, eq, gte, lte, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filters = []

  try {
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

    const result = await db
      .select({
        expense: expenses,
        worker: workers,
        master: masters,
        object: objects
      })
      .from(expenses)
      .leftJoin(workers, eq(expenses.contractorId, workers.id))
      .leftJoin(masters, eq(expenses.contractorId, masters.id))
      .leftJoin(objects, eq(expenses.objectId, objects.id))
      .where(and(...filters))
      .orderBy(asc(expenses.operationDate))

    // Формируем результирующий массив с именем контрагента
    return result.map(({ expense, worker, master, object }) => ({
      ...expense,
      contractorName: expense.contractorType === 'worker' 
        ? worker?.name || 'Неизвестный рабочий' 
        : master?.name || 'Неизвестный мастер',
      objectName: object?.name || 'Без объекта'
    }))
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Ошибка фильтрации по дате'
    })
  }
})
