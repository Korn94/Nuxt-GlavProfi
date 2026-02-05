// server/api/tags/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../db'
import { boardsTags } from '../../db/schema'
import { verifyAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидация обязательных полей
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название тега обязательно'
      })
    }

    // Проверяем, что тег с таким названием ещё не существует
    const existingTags = await db
      .select()
      .from(boardsTags)
      .where(db.boardsTags.name === body.name.trim())

    if (existingTags.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Тег с таким названием уже существует'
      })
    }

    // Валидация цвета (должен быть в формате HEX)
    let color = '#6c757d' // Цвет по умолчанию (серый)
    if (body.color) {
      if (typeof body.color === 'string' && /^#[0-9A-F]{6}$/i.test(body.color)) {
        color = body.color
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Цвет должен быть в формате HEX (#RRGGBB)'
        })
      }
    }

    // Создаём тег
    const [newTag] = await db
      .insert(boardsTags)
      .values({
        name: body.name.trim(),
        color: color
      })
      .returning()

    return {
      success: true,
      tag: newTag
    }
  } catch (error) {
    console.error('Error creating tag:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create tag'
    })
  }
})
