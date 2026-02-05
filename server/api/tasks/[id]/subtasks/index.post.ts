// server/api/tasks/[id]/subtasks/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../../db'
import { boardsSubtasks } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID задачи из параметров
    const taskIdParam = event.context.params?.id

    if (!taskIdParam || isNaN(Number(taskIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }

    const taskId = Number(taskIdParam)

    // Проверяем, существует ли задача
    const [task] = await db
      .select()
      .from(db.boardsTasks)
      .where(eq(db.boardsTasks.id, taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидация обязательных полей
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название подзадачи обязательно'
      })
    }

    // Подготавливаем данные для вставки
    const subtaskData: any = {
      taskId: taskId,
      title: body.title.trim(),
      description: body.description || null,
      parentId: body.parentId || null,
      order: body.order || 0,
      isCompleted: false
    }

    // Создаём подзадачу
    const [newSubtask] = await db
      .insert(boardsSubtasks)
      .values(subtaskData)
      .returning()

    return {
      success: true,
      subtask: newSubtask
    }
  } catch (error) {
    console.error('Error creating subtask:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create subtask'
    })
  }
})
