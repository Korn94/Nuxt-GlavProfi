// server/api/boards/folders/[id]/index.delete.ts
import { eventHandler, createError, getRouterParam } from 'h3'
import { db } from '../../../../db'
import { boardFolders, boards } from '../../../../db/schema'
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

    // Проверяем, существует ли папка
    const [existingFolder] = await db
      .select()
      .from(boardFolders)
      .where(eq(boardFolders.id, folderId))

    if (!existingFolder) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Папка не найдена'
      })
    }

    // Проверяем, есть ли доски в этой папке
    const boardsInFolder = await db
      .select()
      .from(boards)
      .where(eq(boards.folderId, folderId))

    if (boardsInFolder.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `Нельзя удалить папку: в ней есть ${boardsInFolder.length} досок`
      })
    }

    // Удаляем папку
    await db
      .delete(boardFolders)
      .where(eq(boardFolders.id, folderId))

    return {
      success: true,
      message: 'Папка успешно удалена'
    }
  } catch (error) {
    console.error('❌ Ошибка при удалении папки:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось удалить папку'
    })
  }
})
