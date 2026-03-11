// server/api/boards/[id]/tasks/index.post.ts
/**
 * API Endpoint: Создание задачи
 * 
 * Архитектура:
 * - POST /api/boards/{boardId}/tasks
 * - Валидация данных и прав доступа
 * - Создание в БД + broadcast через Socket.IO
 * - Логирование на русском языке
 */

import { eventHandler, createError, readBody } from 'h3'
import { db, boards, boardsTasks, boardsTasksTags } from '../../../../db'
import { eq, desc } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { broadcastTaskCreated } from '../../../../socket/handlers/tasks'
import type { Task } from '~/types/boards'

/**
 * Интерфейс тела запроса
 */
interface CreateTaskBody {
  title: string
  description?: string | null
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: number | null
  dueDate?: string | null
  order?: number
  tags?: number[]
}

/**
 * Интерфейс ответа API
 */
interface CreateTaskResponse {
  success: boolean
  task: Task
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<CreateTaskResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос создания задачи: пользователь ${user.id}`)
    
    // ============================================
    // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ID ДОСКИ
    // ============================================
    
    const boardIdParam = event.context.params?.id
    
    if (!boardIdParam || isNaN(Number(boardIdParam))) {
      console.warn(`[API] ⚠️ Некорректный ID доски: ${boardIdParam}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }
    
    const boardId = Number(boardIdParam)
    console.log(`[API] 🔍 Создание задачи для доски ${boardId}`)
    
    // ============================================
    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ДОСКИ
    // ============================================
    
    const [board] = await db
        .select({
          id: boards.id,
          name: boards.name,
          folderId: boards.folderId
        })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1)
    
    if (!board) {
      console.warn(`[API] ⚠️ Доска ${boardId} не найдена`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Доска не найдена'
      })
    }
    
    console.log(`[API] ✅ Доска найдена: "${board.name}"`)
    
    // ============================================
    // 4. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
    // ============================================
    
    const body = await readBody<CreateTaskBody>(event)
    
    // Проверка названия
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
      console.warn(`[API] ⚠️ Пустое название задачи`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Название задачи обязательно'
      })
    }
    
    if (body.title.trim().length > 255) {
      console.warn(`[API] ⚠️ Название задачи слишком длинное (${body.title.trim().length} символов)`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Название задачи не может превышать 255 символов'
      })
    }
    
    // Валидация статуса
    if (body.status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Статус должен быть одним из: ${validStatuses.join(', ')}`
        })
      }
    }
    
    // Валидация приоритета
    if (body.priority !== undefined) {
      const validPriorities = ['low', 'medium', 'high', 'urgent']
      if (!validPriorities.includes(body.priority)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Приоритет должен быть одним из: ${validPriorities.join(', ')}`
        })
      }
    }
    
    // Валидация тегов
    if (body.tags !== undefined && !Array.isArray(body.tags)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'tags должен быть массивом ID'
      })
    }
    
    // ============================================
    // 5. ПОДГОТОВКА ДАННЫХ ДЛЯ ВСТАВКИ
    // ============================================
    
    const taskData = {
      boardId,
      title: body.title.trim(),
      description: body.description ?? null,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      assignedTo: body.assignedTo ?? null,
      dueDate: body.dueDate ?? null,
      order: body.order ?? 0,
      createdBy: user.id
    }
    
    // ============================================
    // 6. СОЗДАНИЕ ЗАДАЧИ В БД
    // ============================================
    
    const [newTask] = await db
      .insert(boardsTasks)
      .values(taskData)
      .$returningId()
    
    if (!newTask?.id) {
      console.error(`[API] ❌ Не удалось создать задачу: нет ID`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать задачу'
      })
    }
    
    console.log(`[API] ✅ Задача создана в БД: ${newTask.id}`)
    
    // ============================================
    // 7. ПОЛУЧЕНИЕ ПОЛНЫХ ДАННЫХ ЗАДАЧИ
    // ============================================
    
    const [createdTask] = await db
      .select()
      .from(boardsTasks)
      .where(eq(boardsTasks.id, newTask.id))
    
    if (!createdTask) {
      console.error(`[API] ❌ Не удалось получить созданную задачу`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить созданную задачу'
      })
    }
    
    // ============================================
    // 8. ОБНОВЛЕНИЕ ТЕГОВ (ЕСЛИ ПЕРЕДАНЫ)
    // ============================================
    
    if (body.tags && Array.isArray(body.tags) && body.tags.length > 0) {
      const tagRelations = body.tags.map((tagId: number) => ({
        taskId: createdTask.id,
        tagId
      }))
      
      await db
        .insert(boardsTasksTags)
        .values(tagRelations)
      
      console.log(`[API] ✅ Добавлено ${body.tags.length} тегов к задаче`)
    }
    
    // ============================================
    // 9. КОНВЕРТАЦИЯ ДАТ В ISO-СТРОКИ
    // ============================================
    
    const taskForResponse: Task = {
      id: createdTask.id,
      boardId: createdTask.boardId,
      title: createdTask.title,
      description: createdTask.description ?? null,
      status: createdTask.status as Task['status'],
      priority: createdTask.priority as Task['priority'],
      assignedTo: createdTask.assignedTo ?? null,
      dueDate: createdTask.dueDate ?? null,
      completedDate: createdTask.completedDate ?? null,
      order: createdTask.order ?? 0,
      createdBy: createdTask.createdBy,
      createdAt: createdTask.createdAt 
        ? new Date(createdTask.createdAt).toISOString() 
        : new Date().toISOString(),
      updatedAt: createdTask.updatedAt 
        ? new Date(createdTask.updatedAt).toISOString() 
        : new Date().toISOString(),
      // Пустые массивы для связанных данных (загружаются отдельно)
      subtasks: [],
      tags: [],
      attachments: [],
      comments: []
    }
    
    // ============================================
    // 10. BROADCAST СОБЫТИЯ ЧЕРЕЗ SOCKET.IO
    // ============================================
    
    const io = getIO()
    
    if (io) {
      console.log(`[API] 📡 Broadcast создания задачи ${createdTask.id} на доску ${boardId}`)
      
      // ✅ ИСПОЛЬЗУЕМ broadcastTaskCreated (io.to), а НЕ handleTaskCreate (socket.to)
      broadcastTaskCreated(io, taskForResponse, boardId)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }
    
    // ============================================
    // 11. ВОЗВРАТ ОТВЕТА
    // ============================================
    
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Задача создана за ${executionTime}мс`)
    
    return {
      success: true,
      task: taskForResponse
    }
    
  } catch (error) {
    // ============================================
    // 12. ОБРАБОТКА ОШИБОК
    // ============================================
    
    const executionTime = Date.now() - startTime
    
    // Если это уже ошибка h3, пробрасываем её
    if (error instanceof Error && 'statusCode' in error) {
      console.error(`[API] ❌ Ошибка (за ${executionTime}мс):`, (error as any).statusMessage)
      throw error
    }
    
    // Логируем непредвиденные ошибки
    console.error(`[API] ❌ Непредвиденная ошибка (за ${executionTime}мс):`, error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось создать задачу'
    })
  }
})
