// server/api/boards/folders/[id]/boards.get.ts
import { eventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { boards, objects } from '../../../../db/schema'
import { eq, asc } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    await verifyAuth(event)

    // Получаем ID папки из параметров
    const folderIdParam = getRouterParam(event, 'id')
    if (!folderIdParam || isNaN(Number(folderIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID папки'
      })
    }

    const folderId = Number(folderIdParam)

    // Получаем все доски папки
    const boardsList = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        type: boards.type,
        objectId: boards.objectId,
        folderId: boards.folderId,
        order: boards.order,
        createdBy: boards.createdBy,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt
      })
      .from(boards)
      .where(eq(boards.folderId, folderId))
      .orderBy(asc(boards.order))

    // Получаем информацию об объектах для досок типа 'object'
    const boardsWithObjects = await Promise.all(
      boardsList.map(async (board) => {
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
      total: boardsWithObjects.length,
      folderId
    }
  } catch (error) {
    console.error('❌ Ошибка при получении досок папки:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось загрузить доски папки'
    })
  }
})
