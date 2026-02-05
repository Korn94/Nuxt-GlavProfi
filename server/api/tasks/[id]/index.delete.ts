// server/api/tasks/[id]/index.delete.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../db'
import { boardsTasks } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID задачи из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }

    const taskId = Number(id)

    // Проверяем, существует ли задача
    const [existingTask] = await db
      .select()
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))

    if (!existingTask) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Удаляем задачу (каскадное удаление удалит все подзадачи, теги, комментарии и т.д.)
    await db
      .delete(boardsTasks)
      .where(eq(boardsTasks.id, taskId))

    return {
      success: true,
      message: 'Задача успешно удалена'
    }
  } catch (error) {
    console.error('Error deleting task:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete task'
    })
  }
})
