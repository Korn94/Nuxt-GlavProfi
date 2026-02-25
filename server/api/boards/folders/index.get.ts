// server/api/boards/folders/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardFolders } from '../../../db/schema'
import { asc } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    await verifyAuth(event)

    // ✅ ПОЛУЧАЕМ СПИСОК ПАПОК (без параметров!)
    const folders = await db
      .select({
        id: boardFolders.id,
        name: boardFolders.name,
        description: boardFolders.description,
        category: boardFolders.category,
        order: boardFolders.order,
        createdBy: boardFolders.createdBy,
        createdAt: boardFolders.createdAt,
        updatedAt: boardFolders.updatedAt
      })
      .from(boardFolders)
      .orderBy(asc(boardFolders.order))

    return {
      folders,
      total: folders.length
    }
  } catch (error) {
    console.error('❌ Ошибка при получении папок:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось загрузить папки'
    })
  }
})
