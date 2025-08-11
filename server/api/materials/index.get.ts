// server/api/materials/index.get.ts
// Импортируем sql для работы с SQL-выражениями
import { defineEventHandler, getQuery } from 'h3'
import { db } from '../../db'
import { materials } from '../../db/schema'
import { eq, gte, lte, and, sql } from 'drizzle-orm' // Добавлен sql

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const objectId = query.objectId ? parseInt(query.objectId as string) : null
  const type = query.type // Тип из строки запроса (string)

  const filters = []

  // Фильтрация по объекту
  if (objectId) {
    filters.push(eq(materials.objectId, objectId))
  }

  // Фильтрация по типу (incoming/outgoing)
  if (type === 'incoming' || type === 'outgoing') {
    // Используем sql для явного указания типа
    filters.push(sql`${materials.type} = ${type}`)
  }

  // Фильтрация по дате
  if (query.startDate) {
    const startDate = new Date(query.startDate as string)
    filters.push(gte(materials.operationDate, startDate))
  }
  if (query.endDate) {
    const endDate = new Date(query.endDate as string)
    filters.push(lte(materials.operationDate, endDate))
  }

  try {
    const result = await db
      .select()
      .from(materials)
      .where(filters.length > 0 ? and(...filters) : undefined)

    return result
  } catch (error) {
    console.error('Ошибка получения материалов:', error)
    throw new Error('Не удалось получить материалы')
  }
})
