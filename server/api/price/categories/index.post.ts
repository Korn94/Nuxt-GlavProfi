// server/api/price/categories/index.post.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceCategories } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    
    if (!body.pageId || !body.name) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Необходимо указать pageId и name'
      })
    }

    const [newCategory] = await db.insert(priceCategories).values({
      pageId: body.pageId,
      name: body.name,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).$returningId()

    return newCategory
  } catch (error) {
    console.error('Ошибка добавления категории:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось добавить категорию'
    })
  }
})