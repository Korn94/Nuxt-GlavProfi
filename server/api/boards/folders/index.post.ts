// server/api/boards/folders/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../db'
import { boardFolders, boards } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Читаем тело запроса
    const body = await readBody(event)

    // ✅ ВАЛИДАЦИЯ ВЛОЖЕННОЙ СТРУКТУРЫ
    if (!body.folder?.name || typeof body.folder.name !== 'string' || body.folder.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название папки обязательно'
      })
    }

    // ✅ ВАЛИДАЦИЯ КАТЕГОРИИ
    const validCategories = ['objects', 'general']
    if (!body.folder.category || !validCategories.includes(body.folder.category)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Категория должна быть одной из: ${validCategories.join(', ')}`
      })
    }

    // Проверяем, что папка с таким названием ещё не существует
    const [existingFolder] = await db
      .select()
      .from(boardFolders)
      .where(eq(boardFolders.name, body.folder.name.trim()))

    if (existingFolder) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Папка с таким названием уже существует'
      })
    }

    // ✅ ПОДГОТАВЛИВАЕМ ДАННЫЕ ДЛЯ ВСТАВКИ С КАТЕГОРИЕЙ
    const folderData = {
      name: body.folder.name.trim(),
      description: body.folder.description?.trim() || null,
      category: body.folder.category, // ✅ КРИТИЧЕСКИ ВАЖНО: передаём категорию
      order: body.folder.order !== undefined ? Number(body.folder.order) : 0,
      createdBy: user.id
    }

    // Создаём папку
    const [newFolder] = await db
      .insert(boardFolders)
      .values(folderData)
      .$returningId()

    if (!newFolder || !newFolder.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать папку'
      })
    }

    // Получаем полные данные папки
    const [folder] = await db
      .select({
        id: boardFolders.id,
        name: boardFolders.name,
        description: boardFolders.description,
        category: boardFolders.category, // ✅ Возвращаем категорию
        order: boardFolders.order,
        createdBy: boardFolders.createdBy,
        createdAt: boardFolders.createdAt,
        updatedAt: boardFolders.updatedAt
      })
      .from(boardFolders)
      .where(eq(boardFolders.id, newFolder.id))

    if (!folder) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить данные созданной папки'
      })
    }

    // Если передана первая доска, создаём её
    let firstBoard = null
    if (body.firstBoard) {
      // Валидация данных доски
      if (!body.firstBoard.name || typeof body.firstBoard.name !== 'string' || body.firstBoard.name.trim().length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название доски обязательно'
        })
      }

      const boardData: any = {
        folderId: folder.id,
        name: body.firstBoard.name.trim(),
        description: body.firstBoard.description?.trim() || null,
        type: body.firstBoard.type || body.folder.category || 'general',
        order: 0,
        createdBy: user.id
      }

      // Если тип 'object', проверяем наличие объекта
      if (body.firstBoard.type === 'object' && body.firstBoard.objectId) {
        boardData.objectId = body.firstBoard.objectId
      }

      const boardResult = await db
        .insert(boards)
        .values(boardData)
        .$returningId()

      if (boardResult && boardResult.length > 0 && boardResult[0]) {
        const createdBoardId = boardResult[0].id
        
        // Получаем полные данные доски
        const [createdBoard] = await db
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
          .where(eq(boards.id, createdBoardId))

        firstBoard = createdBoard
      }
    }

    return {
      success: true,
      folder,
      board: firstBoard
    }
  } catch (error) {
    console.error('Ошибка при создании папки:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось создать папку'
    })
  }
})
