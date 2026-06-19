// server/api/boards/folders/[id]/index.put.ts
import { eventHandler, createError, readBody, getRouterParam } from 'h3'
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

    // Читаем тело запроса
    const body = await readBody(event)

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем название, если передано
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название папки не может быть пустым'
        })
      }

      // Проверяем, что папка с таким названием ещё не существует (кроме текущей)
      const [duplicateFolder] = await db
        .select()
        .from(boardFolders)
        .where(eq(boardFolders.name, body.name.trim()))

      if (duplicateFolder && duplicateFolder.id !== folderId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Папка с таким названием уже существует'
        })
      }

      updateData.name = body.name.trim()
    }

    // Обновляем описание, если передано
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }

    // Обновляем категорию, если передано
    if (body.category !== undefined) {
      const validCategories = ['objects', 'general']
      if (!validCategories.includes(body.category)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Категория должна быть одной из: ${validCategories.join(', ')}`
        })
      }
      updateData.category = body.category
    }

    // Обновляем порядок, если передано
    if (body.order !== undefined) {
      if (typeof body.order !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Порядок должен быть числом'
        })
      }
      updateData.order = body.order
    }

    // Если нет данных для обновления
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления'
      })
    }

    // Обновляем папку
    await db
      .update(boardFolders)
      .set(updateData)
      .where(eq(boardFolders.id, folderId))

    // Получаем обновлённую папку
    const [updatedFolder] = await db
      .select()
      .from(boardFolders)
      .where(eq(boardFolders.id, folderId))

    return {
      success: true,
      folder: updatedFolder
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении папки:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось обновить папку'
    })
  }
})
