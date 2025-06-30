// server/api/price/subcategories/index.post.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { priceSubCategories } from '../../../db/schema'
import { H3Event, readBody } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody(event)
    
    if (!body.categoryId || !body.name) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Необходимо указать categoryId и name'
      })
    }

    const [newSubcategory] = await db.insert(priceSubCategories).values({
      categoryId: body.categoryId,
      name: body.name,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).$returningId()

    return newSubcategory
  } catch (error) {
    console.error('Ошибка добавления подкатегории:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось добавить подкатегорию'
    })
  }
})