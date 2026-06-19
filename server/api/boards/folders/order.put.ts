// server/api/boards/folders/order.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../db'
import { boardFolders } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    await verifyAuth(event)

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидация данных
    if (!body.updates || !Array.isArray(body.updates)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректные данные: ожидается массив обновлений'
      })
    }

    // Валидация каждого элемента
    for (const update of body.updates) {
      if (typeof update.id !== 'number' || typeof update.order !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Каждый элемент должен содержать поля id и order'
        })
      }
    }

    // Обновляем порядок для каждой папки
    for (const update of body.updates) {
      await db
        .update(boardFolders)
        .set({ order: update.order })
        .where(eq(boardFolders.id, update.id))
    }

    return {
      success: true,
      message: `Обновлён порядок для ${body.updates.length} папок`
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении порядка папок:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось обновить порядок папок'
    })
  }
})
