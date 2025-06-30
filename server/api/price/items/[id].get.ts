// server/api/price/items/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { priceItems } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw new Error('Не указан ID подкатегории')
  }

  // Получаем работы по subCategoryId
  const items = await db.select().from(priceItems)
    .where(eq(priceItems.subCategoryId, Number(id)))

  return items
})