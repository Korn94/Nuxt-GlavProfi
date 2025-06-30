// server/api/price/dopworks/index.get.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceAdditionalItems } from '../../../db/schema'

export default defineEventHandler(async () => {
  try {
    const pages = await db.select().from(priceAdditionalItems)
    return pages
  } catch (error) {
    console.error('Ошибка получения страниц:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось получить список страниц'
    })
  }
})