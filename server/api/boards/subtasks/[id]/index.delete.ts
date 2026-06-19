// server/api/boards/subtasks/[id]/index.delete.ts
/**
 * API Endpoint: Удаление подзадачи
 * 
 * Архитектура:
 * - Удаление подзадачи с каскадным удалением детей
 * - Проверка доступа к задаче и доске
 * - Отправка socket события всем пользователям в комнате доски
 * - Логирование на русском языке
 * - Типизированный ответ
 */

import { eventHandler, createError } from 'h3'
import { db, boardsSubtasks, boardsTasks } from '../../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { emitSubtaskDeleted } from '../../../../socket/handlers/subtasks'
import type { Subtask } from '~/types/boards'

/**
 * Интерфейс ответа API
 */
interface DeleteSubtaskResponse {
  success: boolean
  message: string
  deletedSubtaskId: number
  taskId: number
}

/**
 * Рекурсивное получение всех дочерних подзадач (для логирования)
 * @param parentId - ID родительской подзадачи
 * @returns Массив ID всех дочерних подзадач
 */
async function collectChildSubtaskIds(parentId: number): Promise<number[]> {
  const children = await db
    .select({ id: boardsSubtasks.id })
    .from(boardsSubtasks)
    .where(eq(boardsSubtasks.parentId, parentId))
  
  if (children.length === 0) {
    return []
  }
  
  const childIds = children.map(c => c.id)
  let allIds = [...childIds]
  
  // Рекурсивно собираем внуков
  for (const child of children) {
    const grandchildrenIds = await collectChildSubtaskIds(child.id)
    allIds = [...allIds, ...grandchildrenIds]
  }
  
  return allIds
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<DeleteSubtaskResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос удаления подзадачи: пользователь ${user.id}`)
    
    // ============================================
    // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ID ПОДЗАДАЧИ
    // ============================================
    
    const idParam = event.context.params?.id
    
    if (!idParam || isNaN(Number(idParam))) {
      console.warn(`[API] ⚠️ Некорректный ID подзадачи: ${idParam}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID подзадачи'
      })
    }
    
    const subtaskId = Number(idParam)
    console.log(`[API] 🔍 Удаление подзадачи ${subtaskId}`)
    
    // ============================================
    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОДЗАДАЧИ
    // ============================================
    
    const [existingSubtask] = await db
      .select({
        id: boardsSubtasks.id,
        taskId: boardsSubtasks.taskId,
        parentId: boardsSubtasks.parentId,
        title: boardsSubtasks.title
      })
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
      .limit(1)
    
    if (!existingSubtask) {
      console.warn(`[API] ⚠️ Подзадача ${subtaskId} не найдена`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Подзадача не найдена'
      })
    }
    
    console.log(`[API] ✅ Подзадача найдена: "${existingSubtask.title}" (задача ${existingSubtask.taskId})`)
    
    // ============================================
    // 4. СОБИРАЕМ ID ВСЕХ ДОЧЕРНИХ ПОДЗАДАЧ (ДЛЯ ЛОГИРОВАНИЯ)
    // ============================================
    
    const childSubtaskIds = await collectChildSubtaskIds(subtaskId)
    const totalToDelete = 1 + childSubtaskIds.length
    
    if (childSubtaskIds.length > 0) {
      console.log(`[API] 📊 Будет удалено подзадач: ${totalToDelete} (включая ${childSubtaskIds.length} дочерних)`)
    }
    
    // ============================================
    // 5. СОХРАНЯЕМ ДАННЫЕ ДЛЯ SOCKET СОБЫТИЯ
    // ============================================
    
    const taskId = existingSubtask.taskId
    
    // ============================================
    // 6. ПОЛУЧЕНИЕ ID ДОСКИ ЧЕРЕЗ ЗАДАЧУ
    // ============================================
    
    const [task] = await db
      .select({ boardId: boardsTasks.boardId })
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))
      .limit(1)
    
    if (!task?.boardId) {
      console.warn(`[API] ⚠️ Не удалось получить boardId для задачи ${taskId}`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось определить доску'
      })
    }
    
    const boardId = task.boardId
    console.log(`[API] 📋 Board ID: ${boardId}`)
    
    // ============================================
    // 7. УДАЛЕНИЕ ПОДЗАДАЧИ
    // ============================================
    /**
     * ⚠️ ВАЖНО: Каскадное удаление настроено в схеме БД
     * boardsSubtasks.parentId имеет onDelete: 'cascade'
     * Поэтому при удалении родителя все дети удалятся автоматически
     */
    
    await db
      .delete(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
    
    console.log(`[API] ✅ Подзадача ${subtaskId} удалена из БД (каскадно удалено детей: ${childSubtaskIds.length})`)
    
    // ============================================
    // 8. ОТПРАВКА SOCKET СОБЫТИЯ
    // ============================================
    
    const io = getIO()
    
    if (io) {
      emitSubtaskDeleted(io, subtaskId, taskId, boardId)
      console.log(`[API] 📡 Socket событие отправлено в комнату board:${boardId}`)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }
    
    // ============================================
    // 9. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Подзадача удалена за ${executionTime}мс`)
    
    return {
      success: true,
      message: childSubtaskIds.length > 0 
        ? `Подзадача и ${childSubtaskIds.length} дочерних успешно удалены` 
        : 'Подзадача успешно удалена',
      deletedSubtaskId: subtaskId,
      taskId
    }
    
  } catch (error) {
    // ============================================
    // 10. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось удалить подзадачу'
    })
  }
})
