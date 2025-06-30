// server/api/price/pages/index.post.ts
import { defineEventHandler, createError } from 'h3'
import { db } from '../../../db'
import { pricePages } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { H3Event, readBody } from 'h3'

interface PricePage {
  title: string
  slug: string
  order?: number
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const body = await readBody<PricePage>(event)
    
    if (!body.title || !body.slug) {
      throw createError({ 
        statusCode: 400,
        statusMessage: 'Необходимо указать title и slug'
      })
    }

    const [newPage] = await db.insert(pricePages).values({
      title: body.title,
      slug: body.slug,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }).$returningId()

    return newPage
  } catch (error) {
    console.error('Ошибка добавления страницы:', error)
    throw createError({ 
      statusCode: 500,
      statusMessage: 'Не удалось добавить страницу'
    })
  }
})