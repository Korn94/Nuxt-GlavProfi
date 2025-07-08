// server/api/comings/index.get.ts
import { defineEventHandler, getQuery, createError } from 'h3'
import { db } from '../../db'
import { comings } from '../../db/schema'
import { and, gte, lte, desc } from 'drizzle-orm' // Добавлен desc для сортировки

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const filters = []

  try {
    // Фильтрация по дате
    if (query.startDate) {
      const startDate = new Date(query.startDate as string)
      if (isNaN(startDate.getTime())) throw new Error('Неверный формат даты startDate')
      filters.push(gte(comings.operationDate, startDate))
    }

    if (query.endDate) {
      const endDate = new Date(query.endDate as string)
      if (isNaN(endDate.getTime())) throw new Error('Неверный формат даты endDate')
      filters.push(lte(comings.operationDate, endDate))
    }

    // Выборка с фильтрацией и сортировкой по убыванию даты
    const result = await db.select()
      .from(comings)
      .where(and(...filters))
      .orderBy(desc(comings.operationDate)) // Сортировка от новых к старым

    return result
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Ошибка фильтрации по дате'
    })
  }
})
