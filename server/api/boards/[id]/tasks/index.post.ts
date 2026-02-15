// server/api/boards/[id]/tasks/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db, boards, boardsTasks, boardsTasksTags } from '../../../../db'
import { eq, desc } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { handleTaskCreate } from '../../../../socket/handlers/tasks'

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
      .from(boards)
      .where(eq(boards.id, boardId))

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
    // ✅ ПРОСТО ВСТАВЛЯЕМ ЗАДАЧУ
    await db
      .insert(boardsTasks)
      .values(taskData)

    // ✅ ПОЛУЧАЕМ СОЗДАННУЮ ЗАДАЧУ ПО ПОСЛЕДНЕМУ ID
    const [newTask] = await db
      .select()
      .from(boardsTasks)
      .where(eq(boardsTasks.boardId, boardId))
      .orderBy(desc(boardsTasks.id))
      .limit(1)

    if (!newTask) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать задачу'
      })
    }

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

    // ✅ КОНВЕРТИРУЕМ ДАТЫ В СТРОКИ И ГАРАНТИРУЕМ НЕ-NULL ЗНАЧЕНИЯ
    const taskForResponse = {
      ...newTask,
      createdAt: newTask.createdAt 
        ? new Date(newTask.createdAt).toISOString() 
        : new Date().toISOString(),
      updatedAt: newTask.updatedAt 
        ? new Date(newTask.updatedAt).toISOString() 
        : new Date().toISOString(),
      completedDate: newTask.completedDate || null,
      dueDate: newTask.dueDate || null
    }

    // ✅ ОТПРАВЛЯЕМ СОКЕТ-СОБЫТИЕ
    const io = event.context.nitro?.io
    if (io) {
      handleTaskCreate(io, newTask.id, taskForResponse, boardId)
    }

    return {
      success: true,
      task: taskForResponse
    }
  } catch (error) {
    console.error('Error creating task:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create task'
    })
  }
})
