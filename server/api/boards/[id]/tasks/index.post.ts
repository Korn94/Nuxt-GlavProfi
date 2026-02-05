// server/api/boards/[id]/tasks/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../../db'
import { boardsTasks, boardsTasksTags } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID доски из параметров
    const boardIdParam = event.context.params?.id

    if (!boardIdParam || isNaN(Number(boardIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }

    const boardId = Number(boardIdParam)

    // Проверяем, существует ли доска
    const [board] = await db
      .select()
      .from(db.boards)
      .where(eq(db.boards.id, boardId))

    if (!board) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Доска не найдена'
      })
    }

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидация обязательных полей
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название задачи обязательно'
      })
    }

    // Валидация статуса
    const validStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']
    if (body.status && !validStatuses.includes(body.status)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Статус должен быть одним из: ${validStatuses.join(', ')}`
      })
    }

    // Валидация приоритета
    const validPriorities = ['low', 'medium', 'high', 'urgent']
    if (body.priority && !validPriorities.includes(body.priority)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Приоритет должен быть одним из: ${validPriorities.join(', ')}`
      })
    }

    // Подготавливаем данные для вставки
    const taskData: any = {
      boardId: boardId,
      title: body.title.trim(),
      description: body.description || null,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      assignedTo: body.assignedTo || null,
      dueDate: body.dueDate || null,
      order: body.order || 0,
      createdBy: user.id
    }

    // Создаём задачу
    const [newTask] = await db
      .insert(boardsTasks)
      .values(taskData)
      .returning()

    // Если переданы теги, добавляем их
    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      const tagRelations = body.tags.map((tagId: number) => ({
        taskId: newTask.id,
        tagId: tagId
      }))

      await db
        .insert(boardsTasksTags)
        .values(tagRelations)
    }

    return {
      success: true,
      task: newTask
    }
  } catch (error) {
    console.error('Error creating task:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create task'
    })
  }
})
