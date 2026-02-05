// server/api/boards/[id]/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boards, objects } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }

    const boardId = Number(id)

    // Получаем доску
    const [board] = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        type: boards.type,
        objectId: boards.objectId,
        createdBy: boards.createdBy,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt
      })
      .from(boards)
      .where(eq(boards.id, boardId))

    if (!board) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Доска не найдена'
      })
    }

    // Получаем информацию об объекте, если доска привязана к объекту
    let object = null
    if (board.type === 'object' && board.objectId) {
      const [obj] = await db
        .select({
          id: objects.id,
          name: objects.name,
          status: objects.status,
          address: objects.address
        })
        .from(objects)
        .where(eq(objects.id, board.objectId))

      object = obj
    }

    return {
      board: {
        ...board,
        object
      }
    }
  } catch (error) {
    console.error('Error fetching board:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch board'
    })
  }
})
