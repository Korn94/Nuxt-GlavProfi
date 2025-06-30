// server/api/price/details/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { priceItemDetails } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw new Error('Не указан ID подкатегории')
  }

  // Получаем работы по subCategoryId
  const items = await db.select().from(priceItemDetails)
    .where(eq(priceItemDetails.itemId, Number(id)))

  return items
})