// server/api/price/categories/[id].get.ts
import { defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../db'
import { priceCategories } from '../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw new Error('Не указан ID категории')
  }

  const pageId = Number(id)

  return await db.select().from(priceCategories).where(eq(priceCategories.pageId, pageId))
})