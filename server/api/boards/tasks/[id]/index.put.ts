// server/api/boards/tasks/[id]/index.put.ts
/**
 * API Endpoint: Обновление задачи
 * 
 * Архитектура:
 * - PUT /api/boards/tasks/{id}
 * - Валидация данных и прав доступа
 * - Обновление в БД + broadcast через Socket.IO
 * - Логирование на русском языке
 */

import { eventHandler, createError, readBody } from 'h3'
import { db, boardsTasks, boardsTasksTags } from '../../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { broadcastTaskUpdated } from '../../../../socket/handlers/tasks'
import type { Task } from '~/types/boards'

/**
 * Интерфейс тела запроса
 */
interface UpdateTaskBody {
  title?: string
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
interface UpdateTaskResponse {
  success: boolean
  task: Task
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<UpdateTaskResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос обновления задачи: пользователь ${user.id}`)
    
    // ============================================
    // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ID ЗАДАЧИ
    // ============================================
    
    const idParam = event.context.params?.id
    
    if (!idParam || isNaN(Number(idParam))) {
      console.warn(`[API] ⚠️ Некорректный ID задачи: ${idParam}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }
    
    const taskId = Number(idParam)
    console.log(`[API] 🔍 Обновление задачи ${taskId}`)
    
    // ============================================
    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЗАДАЧИ
    // ============================================
    
    const [existingTask] = await db
      .select({
        id: boardsTasks.id,
        boardId: boardsTasks.boardId,
        title: boardsTasks.title,
        status: boardsTasks.status,
        completedDate: boardsTasks.completedDate
      })
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))
      .limit(1)
    
    if (!existingTask) {
      console.warn(`[API] ⚠️ Задача ${taskId} не найдена`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }
    
    console.log(`[API] ✅ Задача найдена: "${existingTask.title}" (доска ${existingTask.boardId})`)
    
    // ============================================
    // 4. ЧТЕНИЕ ТЕЛА ЗАПРОСА
    // ============================================
    
    const body = await readBody<UpdateTaskBody>(event)
    
    if (Object.keys(body).length === 0) {
      console.warn(`[API] ⚠️ Нет данных для обновления`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления'
      })
    }
    
    // ============================================
    // 5. ПОДГОТОВКА ДАННЫХ ДЛЯ ОБНОВЛЕНИЯ
    // ============================================
    
    const updateData: Record<string, any> = {}
    
    // Название
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название задачи не может быть пустым'
        })
      }
      if (body.title.trim().length > 255) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название задачи не может превышать 255 символов'
        })
      }
      updateData.title = body.title.trim()
    }
    
    // Описание
    if (body.description !== undefined) {
      updateData.description = body.description
    }
    
    // Статус
    if (body.status !== undefined) {
      const validStatuses = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled']
      if (!validStatuses.includes(body.status)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Статус должен быть одним из: ${validStatuses.join(', ')}`
        })
      }
      updateData.status = body.status
      
      // Авто-дата завершения при статусе 'done'
      if (body.status === 'done' && !existingTask.completedDate) {
        updateData.completedDate = new Date().toISOString().split('T')[0]
      }
      // Сброс даты завершения при смене статуса с 'done'
      if (body.status !== 'done' && existingTask.completedDate) {
        updateData.completedDate = null
      }
    }
    
    // Приоритет
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
    
    // Назначенный пользователь
    if (body.assignedTo !== undefined) {
      if (body.assignedTo === null || typeof body.assignedTo === 'number') {
        updateData.assignedTo = body.assignedTo
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'assignedTo должен быть числом или null'
        })
      }
    }
    
    // Срок выполнения
    if (body.dueDate !== undefined) {
      updateData.dueDate = body.dueDate
    }
    
    // Порядок
    if (body.order !== undefined) {
      if (typeof body.order !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: 'order должен быть числом'
        })
      }
      updateData.order = body.order
    }
    
    // Если после валидации нет данных для обновления
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления после валидации'
      })
    }
    
    // ============================================
    // 6. ОБНОВЛЕНИЕ ЗАДАЧИ В БД
    // ============================================
    
    updateData.updatedAt = new Date()
    
    await db
      .update(boardsTasks)
      .set(updateData)
      .where(eq(boardsTasks.id, taskId))
    
    console.log(`[API] ✅ Задача обновлена в БД`)
    
    // ============================================
    // 7. ПОЛУЧЕНИЕ ОБНОВЛЁННОЙ ЗАДАЧИ
    // ============================================
    
    const [updatedTask] = await db
      .select()
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))
    
    if (!updatedTask) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить обновлённую задачу'
      })
    }
    
    // ============================================
    // 8. ОБНОВЛЕНИЕ ТЕГОВ (ЕСЛИ ПЕРЕДАНЫ)
    // ============================================
    
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'tags должен быть массивом ID'
        })
      }
      
      // Удаляем все текущие теги
      await db
        .delete(boardsTasksTags)
        .where(eq(boardsTasksTags.taskId, taskId))
      
      // Добавляем новые теги
      if (body.tags.length > 0) {
        const tagRelations = body.tags.map((tagId: number) => ({
          taskId,
          tagId
        }))
        
        await db
          .insert(boardsTasksTags)
          .values(tagRelations)
      }
      
      console.log(`[API] ✅ Теги обновлены: ${body.tags.length} шт.`)
    }
    
    // ============================================
    // 9. ПОЛУЧЕНИЕ ID ДОСКИ
    // ============================================
    
    const boardId = existingTask.boardId
    
    // ============================================
    // 10. КОНВЕРТАЦИЯ ДАТ В ISO-СТРОКИ
    // ============================================
    
    const taskForResponse: Task = {
      id: updatedTask.id,
      boardId: updatedTask.boardId,
      title: updatedTask.title,
      description: updatedTask.description ?? null,
      status: updatedTask.status as Task['status'],
      priority: updatedTask.priority as Task['priority'],
      assignedTo: updatedTask.assignedTo ?? null,
      dueDate: updatedTask.dueDate ?? null,
      completedDate: updatedTask.completedDate ?? null,
      order: updatedTask.order ?? 0,
      createdBy: updatedTask.createdBy,
      createdAt: updatedTask.createdAt 
        ? new Date(updatedTask.createdAt).toISOString() 
        : new Date().toISOString(),
      updatedAt: updatedTask.updatedAt 
        ? new Date(updatedTask.updatedAt).toISOString() 
        : new Date().toISOString(),
      // Пустые массивы для связанных данных (загружаются отдельно)
      subtasks: [],
      tags: [],
      attachments: [],
      comments: []
    }
    
    // ============================================
    // 11. BROADCAST СОБЫТИЯ ЧЕРЕЗ SOCKET.IO
    // ============================================
    
    const io = getIO()
    
    if (io && boardId) {
      console.log(`[API] 📡 Broadcast обновления задачи ${taskId} на доску ${boardId}`)
      
      // ✅ ИСПОЛЬЗУЕМ broadcastTaskUpdated (io.to), а НЕ handleTaskUpdate (socket.to)
      broadcastTaskUpdated(io, taskForResponse, boardId)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен или boardId не найден`)
    }
    
    // ============================================
    // 12. ВОЗВРАТ ОТВЕТА
    // ============================================
    
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Задача обновлена за ${executionTime}мс`)
    
    return {
      success: true,
      task: taskForResponse
    }
    
  } catch (error) {
    // ============================================
    // 13. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось обновить задачу'
    })
  }
})
