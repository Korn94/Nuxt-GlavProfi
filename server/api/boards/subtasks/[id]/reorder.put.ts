// server/api/boards/subtasks/[id]/reorder.put.ts
/**
 * API Endpoint: Пакетное изменение порядка подзадач
 *
 * Архитектура:
 * - Пакетное обновление порядка для нескольких подзадач
 * - Оптимизировано для drag & drop операций
 * - Валидация что все подзадачи принадлежат одной задаче
 * - Проверка циклических зависимостей при смене родителя
 * - Проверка максимальной глубины вложенности
 * - Отправка socket событий для всех обновлённых подзадач
 * - Логирование на русском языке
 * - Типизированный ответ
 * - ✅ Использует централизованные утилиты из ~/utils/subtasks
 */

import { eventHandler, createError, readBody } from 'h3'
import { db, boardsSubtasks, boardsTasks } from '../../../../db'
import { eq, inArray, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../plugins/socket.io'
import { emitSubtaskUpdated } from '../../../../socket/handlers/subtasks'
import type { Subtask } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

// ✅ ИМПОРТ ЦЕНТРАЛИЗОВАННЫХ УТИЛИТ
import {
  calculateSubtaskDepth,
  hasCircularDependency,
  validateParentChange,
  sortSubtasksByOrder
} from '../../../../utils/subtasks'

/**
 * Интерфейс элемента обновления порядка
 */
interface ReorderItem {
  id: number
  order: number
  parentId?: number | null
}

/**
 * Интерфейс тела запроса
 */
interface ReorderSubtasksBody {
  updates: ReorderItem[]
}

/**
 * Интерфейс ответа API
 */
interface ReorderSubtasksResponse {
  success: boolean
  updated: number
  subtasks: Subtask[]
}

/**
 * ✅ Конвертировать дату из БД в ISO-строку
 * Поддерживает Date, string, null, undefined
 */
function convertDateToISO(date: Date | string | null | undefined): string | null {
  if (!date) return null
  
  // Если уже строка - возвращаем как есть (предполагаем ISO формат)
  if (typeof date === 'string') {
    return date
  }
  
  // Если Date - конвертируем в ISO
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString()
}

/**
 * ✅ Конвертировать подзадачу из БД в тип Subtask
 * Учитывает что Drizzle может возвращать string или Date для дат
 */
function convertToSubtaskType(
  dbSubtask: typeof boardsSubtasks.$inferSelect
): Subtask {
  return {
    id: dbSubtask.id,
    taskId: dbSubtask.taskId,
    parentId: dbSubtask.parentId ?? null,
    title: dbSubtask.title,
    description: dbSubtask.description ?? null,
    isCompleted: dbSubtask.isCompleted,
    completedAt: convertDateToISO(dbSubtask.completedAt),
    order: dbSubtask.order ?? 0,
    createdAt: convertDateToISO(dbSubtask.createdAt) ?? new Date().toISOString(),
    updatedAt: convertDateToISO(dbSubtask.updatedAt) ?? new Date().toISOString()
  }
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<ReorderSubtasksResponse> => {
  const startTime = Date.now()

  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос изменения порядка подзадач: пользователь ${user.id}`)

    // ============================================
    // 2. ЧТЕНИЕ ТЕЛА ЗАПРОСА
    // ============================================
    const body = await readBody<ReorderSubtasksBody>(event)

    if (!body.updates || !Array.isArray(body.updates)) {
      console.warn(`[API] ⚠️ Неверный формат данных для reorder`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Неверный формат данных: ожидается массив updates'
      })
    }

    if (body.updates.length === 0) {
      console.warn(`[API] ⚠️ Пустой массив обновлений`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Массив обновлений не может быть пустым'
      })
    }

    console.log(`[API] 📊 Получено ${body.updates.length} обновлений порядка`)

    // ============================================
    // 3. ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
    // ============================================
    const subtaskIds = body.updates.map(u => u.id)

    // Проверка на дубликаты ID
    const uniqueIds = new Set(subtaskIds)
    if (uniqueIds.size !== subtaskIds.length) {
      console.warn(`[API] ⚠️ Обнаружены дубликаты ID в запросе`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Обнаружены дубликаты ID подзадач'
      })
    }

    // ============================================
    // 4. ПОЛУЧЕНИЕ ПОДЗАДАЧ ИЗ БД
    // ============================================
    const existingSubtasksDB = await db
      .select()
      .from(boardsSubtasks)
      .where(inArray(boardsSubtasks.id, subtaskIds))

    // ✅ ПРОВЕРКА ЧТО ПОДЗАДАЧИ НАЙДЕНЫ
    if (existingSubtasksDB.length === 0) {
      console.warn(`[API] ⚠️ Не найдены подзадачи для ID: ${subtaskIds.join(', ')}`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Подзадачи не найдены'
      })
    }

    // ✅ КОНВЕРТИРУЕМ В ТИП Subtask
    const existingSubtasks: Subtask[] = existingSubtasksDB.map(convertToSubtaskType)

    if (existingSubtasks.length !== subtaskIds.length) {
      const foundIds = new Set(existingSubtasks.map(s => s.id))
      const missingIds = subtaskIds.filter(id => !foundIds.has(id))
      console.warn(`[API] ⚠️ Не найдены подзадачи: ${missingIds.join(', ')}`)
      throw createError({
        statusCode: 404,
        statusMessage: `Не найдены подзадачи с ID: ${missingIds.join(', ')}`
      })
    }

    console.log(`[API] ✅ Найдено ${existingSubtasks.length} подзадач в БД`)

    // ============================================
    // 5. ЗАГРУЗКА ВСЕХ ПОДЗАДАЧ ЗАДАЧИ (ДЛЯ ВАЛИДАЦИИ)
    // ============================================
    // ✅ ИСПРАВЛЕНО: Безопасный доступ к первому элементу с явной проверкой
    const firstSubtask = existingSubtasks[0]
    
    // ✅ TypeScript теперь понимает что firstSubtask не undefined
    if (!firstSubtask) {
      console.warn(`[API] ⚠️ Не удалось получить первую подзадачу`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Не удалось определить задачу'
      })
    }

    const taskId = firstSubtask.taskId
    console.log(`[API] 📋 Task ID: ${taskId}`)

    const allSubtasksDB = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.taskId, taskId))

    // ✅ КОНВЕРТИРУЕМ ДАТЫ СРАЗУ ПОСЛЕ ЗАГРУЗКИ
    const allSubtasks: Subtask[] = allSubtasksDB.map(convertToSubtaskType)

    console.log(`[API] 📊 Загружено ${allSubtasks.length} подзадач задачи для валидации`)

    // ============================================
    // 6. ПРОВЕРКА ЧТО ВСЕ ПОДЗАДАЧИ ПРИНАДЛЕЖАТ ОДНОЙ ЗАДАЧЕ
    // ============================================
    const taskIds = new Set(existingSubtasks.map(s => s.taskId))
    if (taskIds.size > 1) {
      console.warn(`[API] ⚠️ Подзадачи принадлежат разным задачам`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Все подзадачи должны принадлежать одной задаче'
      })
    }

    console.log(`[API] 📋 Все подзадачи принадлежат задаче ${taskId}`)

    // ============================================
    // 7. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЗАДАЧИ
    // ============================================
    const [task] = await db
      .select({
        id: boardsTasks.id,
        boardId: boardsTasks.boardId
      })
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))

    if (!task) {
      console.warn(`[API] ⚠️ Задача ${taskId} не найдена`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    console.log(`[API] ✅ Задача найдена, доска ${task.boardId}`)

    // ============================================
    // 8. ПОДГОТОВКА И ВАЛИДАЦИЯ ОБНОВЛЕНИЙ
    // ============================================
    const updates: Array<{
      id: number
      order: number
      parentId?: number | null
    }> = []

    for (const updateItem of body.updates) {
      const existingSubtask = existingSubtasks.find(s => s.id === updateItem.id)
      if (!existingSubtask) continue

      // Проверка что order неотрицательный
      if (typeof updateItem.order !== 'number' || updateItem.order < 0) {
        console.warn(`[API] ⚠️ Неверный порядок для подзадачи ${updateItem.id}`)
        throw createError({
          statusCode: 400,
          statusMessage: `Неверный порядок для подзадачи ${updateItem.id}: должен быть неотрицательным числом`
        })
      }

      // Если указан parentId, проверяем корректность смены родителя
      if (updateItem.parentId !== undefined && updateItem.parentId !== existingSubtask.parentId) {
        const newParentId = updateItem.parentId ?? null

        if (newParentId !== null) {
          // Проверяем что новый родитель принадлежит той же задаче
          const [parentSubtask] = await db
            .select({ taskId: boardsSubtasks.taskId })
            .from(boardsSubtasks)
            .where(eq(boardsSubtasks.id, newParentId))

          if (!parentSubtask || parentSubtask.taskId !== taskId) {
            console.warn(`[API] ⚠️ Родительская подзадача ${newParentId} не принадлежит задаче ${taskId}`)
            throw createError({
              statusCode: 400,
              statusMessage: 'Родительская подзадача должна принадлежать той же задаче'
            })
          }

          // ============================================
          // 9. ПРОВЕРКА МАКСИМАЛЬНОЙ ГЛУБИНЫ (через утилиту)
          // ============================================
          const parentDepth = calculateSubtaskDepth(newParentId, allSubtasks)
          console.log(`[API] 📊 Глубина родительской подзадачи ${newParentId}: ${parentDepth}`)

          if (parentDepth >= MAX_SUBTASK_DEPTH) {
            console.warn(`[API] ⚠️ Достигнута максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней)`)
            throw createError({
              statusCode: 400,
              statusMessage: `Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней) достигнута`
            })
          }

          // ============================================
          // 10. ПРОВЕРКА НА ЦИКЛИЧЕСКУЮ ЗАВИСИМОСТЬ (через утилиту)
          // ============================================
          const hasCircular = hasCircularDependency(updateItem.id, newParentId, allSubtasks)

          if (hasCircular) {
            console.warn(`[API] ⚠️ Обнаружена циклическая зависимость`)
            throw createError({
              statusCode: 400,
              statusMessage: 'Обнаружена циклическая зависимость: нельзя сделать подзадачу дочерней своего потомка'
            })
          }
        }

        // ✅ АЛЬТЕРНАТИВА: Использовать комплексную валидацию
        // const validation = validateParentChange(updateItem.id, newParentId, allSubtasks)
        // if (!validation.valid) {
        //   throw createError({
        //     statusCode: 400,
        //     statusMessage: validation.error
        //   })
        // }
      }

      updates.push({
        id: updateItem.id,
        order: updateItem.order,
        parentId: updateItem.parentId
      })
    }

    console.log(`[API] 📝 Подготовлено ${updates.length} обновлений`)

    // ============================================
    // 11. ВЫПОЛНЕНИЕ ОБНОВЛЕНИЙ В БД
    // ============================================
    // Выполняем обновления в транзакции
    for (const update of updates) {
      const updateData: Record<string, any> = {
        order: update.order,
        updatedAt: new Date()
      }

      if (update.parentId !== undefined) {
        updateData.parentId = update.parentId
      }

      await db
        .update(boardsSubtasks)
        .set(updateData)
        .where(eq(boardsSubtasks.id, update.id))
    }

    console.log(`[API] ✅ Обновления применены в БД`)

    // ============================================
    // 12. ПОЛУЧЕНИЕ ОБНОВЛЁННЫХ ПОДЗАДАЧ
    // ============================================
    const updatedSubtasksDB = await db
      .select()
      .from(boardsSubtasks)
      .where(inArray(boardsSubtasks.id, subtaskIds))

    // ✅ КОНВЕРТИРУЕМ В ТИП Subtask
    const updatedSubtasks: Subtask[] = updatedSubtasksDB.map(convertToSubtaskType)

    // ============================================
    // 13. ОТПРАВКА SOCKET СОБЫТИЙ
    // ============================================
    const io = getIO()
    if (io && task.boardId) {
      // Отправляем событие для каждой обновлённой подзадачи
      for (const subtask of updatedSubtasks) {
        emitSubtaskUpdated(io, subtask, task.boardId)
      }
      console.log(`[API] 📡 Отправлено ${updatedSubtasks.length} socket событий в комнату board:${task.boardId}`)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен или boardId не найден`)
    }

    // ============================================
    // 14. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Порядок подзадач изменён за ${executionTime}мс`)

    return {
      success: true,
      updated: updatedSubtasks.length,
      subtasks: updatedSubtasks
    }

  } catch (error) {
    // ============================================
    // 15. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось изменить порядок подзадач'
    })
  }
})
