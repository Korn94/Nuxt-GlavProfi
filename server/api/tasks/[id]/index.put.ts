// server/api/tasks/[id]/index.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../db'
import { boardsTasks, boardsTasksTags } from '../../../db/schema'
import { eq, and } from 'drizzle-orm'
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

    // Читаем тело запроса
    const body = await readBody(event)

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем название, если передано
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название задачи не может быть пустым'
        })
      }
      updateData.title = body.title.trim()
    }

    // Обновляем описание, если передано
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    // Обновляем статус, если передано
    if (body.status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Статус должен быть одним из: ${validStatuses.join(', ')}`
        })
      }
      updateData.status = body.status
      
      // Если статус изменён на 'done', устанавливаем дату завершения
      if (body.status === 'done' && !existingTask.completedDate) {
        updateData.completedDate = new Date().toISOString().split('T')[0]
      }
      // Если статус изменён с 'done' на другой, сбрасываем дату завершения
      if (body.status !== 'done' && existingTask.completedDate) {
        updateData.completedDate = null
      }
    }

    // Обновляем приоритет, если передано
    if (body.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(body.priority)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Приоритет должен быть одним из: ${validPriorities.join(', ')}`
        })
      }
      updateData.priority = body.priority
    }

    // Обновляем назначенного пользователя, если передано
    if (body.assignedTo !== undefined) {
      if (body.assignedTo === null) {
        updateData.assignedTo = null
      } else if (typeof body.assignedTo === 'number') {
        updateData.assignedTo = body.assignedTo
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'assignedTo должен быть числом или null'
        })
      }
    }

    // Обновляем срок выполнения, если передано
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate
    }

    // Обновляем порядок, если передано
    if (body.order !== undefined) {
      if (typeof body.order === 'number') {
        updateData.order = body.order
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'order должен быть числом'
        })
      }
    }

    // Если нет данных для обновления
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления'
      })
    }

    // Обновляем задачу
    const [updatedTask] = await db
      .update(boardsTasks)
      .set(updateData)
      .where(eq(boardsTasks.id, taskId))
      .returning()

    // Если переданы теги, обновляем их
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'tags должен быть массивом'
        })
      }

      // Удаляем все текущие теги задачи
      await db
        .delete(boardsTasksTags)
        .where(eq(boardsTasksTags.taskId, taskId))

      // Добавляем новые теги, если они есть
      if (body.tags.length > 0) {
        const tagRelations = body.tags.map((tagId: number) => ({
          taskId: taskId,
          tagId: tagId
        }))

        await db
          .insert(boardsTasksTags)
          .values(tagRelations)
      }
    }

    return {
      success: true,
      task: updatedTask
    }
  } catch (error) {
    console.error('Error updating task:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update task'
    })
  }
})
