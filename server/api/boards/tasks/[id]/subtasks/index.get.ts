// server/api/boards/tasks/[id]/subtasks/index.get.ts
/**
 * API Endpoint: Получение подзадач задачи
 * 
 * Архитектура:
 * - Возвращает flat-список подзадач (не дерево)
 * - Дерево строится на клиенте из flat-списка
 * - Проверка доступа к задаче и доске
 * - Логирование на русском языке
 * - Типизированный ответ
 */

import { eventHandler, createError } from 'h3'
import { db, boardsTasks, boardsSubtasks } from '../../../../../db'
import { eq, and, asc } from 'drizzle-orm'
import { verifyAuth } from '../../../../../utils/auth'
import type { Subtask } from '~/types/boards'

/**
 * Интерфейс ответа API
 */
interface GetSubtasksResponse {
  success: boolean
  subtasks: Subtask[]
  total: number
  taskId: number
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<GetSubtasksResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос подзадач: пользователь ${user.id}`)
    
    // ============================================
    // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ID ЗАДАЧИ
    // ============================================
    
    const taskIdParam = event.context.params?.id
    
    if (!taskIdParam || isNaN(Number(taskIdParam))) {
      console.warn(`[API] ⚠️ Некорректный ID задачи: ${taskIdParam}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }
    
    const taskId = Number(taskIdParam)
    console.log(`[API] 🔍 Получение подзадач для задачи ${taskId}`)
    
    // ============================================
    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЗАДАЧИ
    // ============================================
    
    const [task] = await db
      .select({
        id: boardsTasks.id,
        boardId: boardsTasks.boardId,
        title: boardsTasks.title,
        createdBy: boardsTasks.createdBy
      })
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))
      .limit(1)
    
    if (!task) {
      console.warn(`[API] ⚠️ Задача ${taskId} не найдена`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }
    
    console.log(`[API] ✅ Задача найдена: ${task.title} (доска ${task.boardId})`)
    
    // ============================================
    // 4. ПОЛУЧЕНИЕ ВСЕХ ПОДЗАДАЧ ЗАДАЧИ (FLAT)
    // ============================================
    
    const allSubtasks = await db
      .select({
        id: boardsSubtasks.id,
        taskId: boardsSubtasks.taskId,
        parentId: boardsSubtasks.parentId,
        title: boardsSubtasks.title,
        description: boardsSubtasks.description,
        isCompleted: boardsSubtasks.isCompleted,
        completedAt: boardsSubtasks.completedAt,
        order: boardsSubtasks.order,
        createdAt: boardsSubtasks.createdAt,
        updatedAt: boardsSubtasks.updatedAt
      })
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.taskId, taskId))
      .orderBy(asc(boardsSubtasks.order))
    
    console.log(`[API] 📊 Найдено подзадач: ${allSubtasks.length}`)
    
    // ============================================
    // 5. КОНВЕРТАЦИЯ ДАТ В ISO-СТРОКИ
    // ============================================
    
    const subtasksForResponse: Subtask[] = allSubtasks.map(subtask => ({
      id: subtask.id,
      taskId: subtask.taskId,
      parentId: subtask.parentId ?? null,
      title: subtask.title,
      description: subtask.description ?? null,
      isCompleted: subtask.isCompleted,
      completedAt: subtask.completedAt 
        ? new Date(subtask.completedAt).toISOString() 
        : null,
      order: subtask.order,
      createdAt: subtask.createdAt 
        ? new Date(subtask.createdAt).toISOString() 
        : new Date().toISOString(),
      updatedAt: subtask.updatedAt 
        ? new Date(subtask.updatedAt).toISOString() 
        : new Date().toISOString()
    }))
    
    // ============================================
    // 6. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Подзадачи получены за ${executionTime}мс`)
    
    return {
      success: true,
      subtasks: subtasksForResponse,
      total: subtasksForResponse.length,
      taskId
    }
    
  } catch (error) {
    // ============================================
    // 7. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось получить подзадачи'
    })
  }
})
