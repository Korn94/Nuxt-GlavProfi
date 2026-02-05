// server/api/tags/[id]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardsTags, boardsTasksTags } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID тега из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID тега'
      })
    }

    const tagId = Number(id)

    // Проверяем, существует ли тег
    const [existingTag] = await db
      .select()
      .from(boardsTags)
      .where(eq(boardsTags.id, tagId))

    if (!existingTag) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Тег не найден'
      })
    }

    // Проверяем, есть ли задачи с этим тегом
    const tasksWithTag = await db
      .select()
      .from(boardsTasksTags)
      .where(eq(boardsTasksTags.tagId, tagId))

    if (tasksWithTag.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Нельзя удалить тег, который используется в задачах'
      })
    }

    // Удаляем тег
    await db
      .delete(boardsTags)
      .where(eq(boardsTags.id, tagId))

    return {
      success: true,
      message: 'Тег успешно удалён'
    }
  } catch (error) {
    console.error('Error deleting tag:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete tag'
    })
  }
})
