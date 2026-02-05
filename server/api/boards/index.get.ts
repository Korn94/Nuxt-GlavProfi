// server/api/boards/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../db'
import { boards, objects } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { verifyAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем все доски пользователя
    const allBoards = await db
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
      .orderBy(desc(boards.createdAt))

    // Получаем информацию об объектах для досок типа 'object'
    const boardsWithObjects = await Promise.all(
      allBoards.map(async (board) => {
        if (board.type === 'object' && board.objectId) {
          const [object] = await db
            .select({
              id: objects.id,
              name: objects.name,
              status: objects.status,
              address: objects.address
            })
            .from(objects)
            .where(eq(objects.id, board.objectId))

          return {
            ...board,
            object: object || null
          }
        }
        return {
          ...board,
          object: null
        }
      })
    )

    return {
      boards: boardsWithObjects,
      total: boardsWithObjects.length
    }
  } catch (error) {
    console.error('Error fetching boards:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch boards'
    })
  }
})
