// server/api/tasks/[id]/tags/[tagId]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db, boardsTasks } from '../../../../../db'
import { boardsTasksTags } from '../../../../../db/schema'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем параметры
    const taskIdParam = event.context.params?.id
    const tagIdParam = event.context.params?.tagId

    if (!taskIdParam || isNaN(Number(taskIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }

    if (!tagIdParam || isNaN(Number(tagIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID тега'
      })
    }

    const taskId = Number(taskIdParam)
    const tagId = Number(tagIdParam)

    // Проверяем, существует ли задача
    const [task] = await db.select().from(boardsTasks).where(eq(boardsTasks.id, taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Проверяем, существует ли связь между задачей и тегом
    const [existingRelation] = await db
      .select()
      .from(boardsTasksTags)
      .where(and(
        eq(boardsTasksTags.taskId, taskId),
        eq(boardsTasksTags.tagId, tagId)
      ))

    if (!existingRelation) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Тег не найден в задаче'
      })
    }

    // Удаляем связь
    await db
      .delete(boardsTasksTags)
      .where(and(
        eq(boardsTasksTags.taskId, taskId),
        eq(boardsTasksTags.tagId, tagId)
      ))

    return {
      success: true,
      message: 'Тег успешно удалён из задачи'
    }
  } catch (error) {
    console.error('Error removing tag from task:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove tag from task'
    })
  }
})
