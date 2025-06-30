// server/api/contractors/foremans/index.get.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { foremans } from '../../../db/schema'

export default defineEventHandler(async () => {
  try {
    const allForemans = await db.select().from(foremans)
    if (allForemans.length === 0) {
      console.warn('Список прорабов пуст')
    }
    return allForemans
  } catch (error) {
    console.error('Ошибка получения прорабов:', error)
    throw createError({ statusCode: 500, message: 'Не удалось загрузить список прорабов' })
  }
})
