// server/api/tags/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../db'
import { boardsTags } from '../../db/schema'
import { asc } from 'drizzle-orm'
import { verifyAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем все теги
    const tags = await db
      .select({
        id: boardsTags.id,
        name: boardsTags.name,
        color: boardsTags.color,
        createdAt: boardsTags.createdAt
      })
      .from(boardsTags)
      .orderBy(asc(boardsTags.name))

    return {
      tags,
      total: tags.length
    }
  } catch (error) {
    console.error('Error fetching tags:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tags'
    })
  }
})
