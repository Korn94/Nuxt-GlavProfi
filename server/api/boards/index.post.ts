// server/api/boards/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../db'
import { boards } from '../../db/schema'
import { eq } from 'drizzle-orm'
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
        statusMessage: 'Название доски обязательно'
      })
    }

    // Валидация типа доски
    const validTypes = ['object', 'general']
    if (body.type && !validTypes.includes(body.type)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Тип доски должен быть одним из: ${validTypes.join(', ')}`
      })
    }

    const type = body.type || 'general'

    // Проверка objectId для типа 'object'
    let objectId: number | null = null
    if (type === 'object') {
      if (!body.objectId || typeof body.objectId !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Для типа "object" необходимо указать objectId'
        })
      }
      objectId = body.objectId
    }

    // Создаём доску
    const [newBoard] = await db
      .insert(boards)
      .values({
        name: body.name.trim(),
        description: body.description || null,
        type: type,
        objectId: objectId,
        createdBy: user.id
      })
      .$returningId()

    return {
      success: true,
      board: newBoard
    }
  } catch (error) {
    console.error('Error creating board:', error)
    
    // Если это уже созданный error из h3, пробрасываем его
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create board'
    })
  }
})
