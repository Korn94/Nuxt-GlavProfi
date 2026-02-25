// server/api/boards/folders/[id]/index.get.ts
import { eventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { boardFolders } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
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

    // Получаем папку
    const [folder] = await db
      .select({
        id: boardFolders.id,
        name: boardFolders.name,
        description: boardFolders.description,
        order: boardFolders.order,
        createdBy: boardFolders.createdBy,
        createdAt: boardFolders.createdAt,
        updatedAt: boardFolders.updatedAt
      })
      .from(boardFolders)
      .where(eq(boardFolders.id, folderId))

    if (!folder) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Папка не найдена'
      })
    }

    return {
      folder
    }
  } catch (error) {
    console.error('Ошибка при получении папки:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось получить папку'
    })
  }
})
