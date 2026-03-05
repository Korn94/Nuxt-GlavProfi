// server/api/boards/tasks/[id]/subtasks/index.post.ts
/**
 * API Endpoint: Создание подзадачи
 *
 * Архитектура:
 * - Создание подзадачи с валидацией данных
 * - Проверка максимальной глубины вложенности (5 уровней)
 * - Проверка на циклическую зависимость
 * - Отправка socket события всем пользователям в комнате доски
 * - Логирование на русском языке
 * - Типизированный ответ
 * - ✅ Использует централизованные утилиты из ~/utils/subtasks
 */

import { eventHandler, createError, readBody } from 'h3'
import { db, boardsTasks, boardsSubtasks } from '../../../../../db'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../../utils/auth'
import { getIO } from '../../../../../plugins/socket.io'
import { emitSubtaskCreated } from '../../../../../socket/handlers/subtasks'
import type { Subtask } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

// ✅ ИМПОРТ ЦЕНТРАЛИЗОВАННЫХ УТИЛИТ
import {
  calculateSubtaskDepth,
  hasCircularDependency,
  validateParentChange,
  validateCreateSubtaskData,
  sortSubtasksByOrder
} from '../../../../../utils/subtasks'

/**
 * Интерфейс тела запроса
 */
interface CreateSubtaskBody {
  title: string
  description?: string | null
  parentId?: number | null
  order?: number
}

/**
 * Интерфейс ответа API
 */
interface CreateSubtaskResponse {
  success: boolean
  subtask: Subtask
}

/**
 * Конвертировать дату из БД в ISO-строку
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
 * Конвертировать подзадачу из БД в тип Subtask
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
export default eventHandler(async (event): Promise<CreateSubtaskResponse> => {
  const startTime = Date.now()

  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос создания подзадачи: пользователь ${user.id}`)

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
    console.log(`[API] 🔍 Создание подзадачи для задачи ${taskId}`)

    // ============================================
    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ЗАДАЧИ
    // ============================================
    const [task] = await db
      .select({
        id: boardsTasks.id,
        boardId: boardsTasks.boardId,
        title: boardsTasks.title
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
    console.log(`[API] ✅ Задача найдена: "${task.title}" (доска ${task.boardId})`)

    // ============================================
    // 4. ЗАГРУЗКА ВСЕХ ПОДЗАДАЧ ЗАДАЧИ (ДЛЯ ВАЛИДАЦИИ)
    // ============================================
    // ✅ Загружаем flat-список для использования в утилитах
    const allSubtasksDB = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.taskId, taskId))

    // ✅ КОНВЕРТИРУЕМ ДАТЫ СРАЗУ ПОСЛЕ ЗАГРУЗКИ
    const allSubtasks: Subtask[] = allSubtasksDB.map(convertToSubtaskType)

    // ============================================
    // 5. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
    // ============================================
    const body = await readBody<CreateSubtaskBody>(event)

    // ✅ Используем централизованную валидацию
    const validation = validateCreateSubtaskData(body, allSubtasks)
    if (!validation.valid) {
      console.warn(`[API] ⚠️ Ошибка валидации: ${validation.errors.join(', ')}`)
      throw createError({
        statusCode: 400,
        statusMessage: validation.errors.join('; ')
      })
    }

    // ============================================
    // 6. ПРОВЕРКА РОДИТЕЛЬСКОЙ ПОДЗАДАЧИ
    // ============================================
    const parentId = body.parentId ?? null

    if (parentId !== null) {
      // Проверяем существование родительской подзадачи
      const [parentSubtask] = await db
        .select({
          id: boardsSubtasks.id,
          taskId: boardsSubtasks.taskId,
          parentId: boardsSubtasks.parentId
        })
        .from(boardsSubtasks)
        .where(eq(boardsSubtasks.id, parentId))
        .limit(1)

      if (!parentSubtask) {
        console.warn(`[API] ⚠️ Родительская подзадача ${parentId} не найдена`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Родительская подзадача не найдена'
        })
      }

      // Проверяем что родительская подзадача принадлежит той же задаче
      if (parentSubtask.taskId !== taskId) {
        console.warn(`[API] ⚠️ Родительская подзадача принадлежит другой задаче`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Родительская подзадача должна принадлежать той же задаче'
        })
      }

      // ============================================
      // 7. ПРОВЕРКА МАКСИМАЛЬНОЙ ГЛУБИНЫ (через утилиту)
      // ============================================
      const parentDepth = calculateSubtaskDepth(parentId, allSubtasks)
      console.log(`[API] 📊 Глубина родительской подзадачи ${parentId}: ${parentDepth}`)

      if (parentDepth >= MAX_SUBTASK_DEPTH) {
        console.warn(`[API] ⚠️ Достигнута максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней)`)
        throw createError({
          statusCode: 400,
          statusMessage: `Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней) достигнута`
        })
      }

      // ============================================
      // 8. ПРОВЕРКА НА ЦИКЛИЧЕСКУЮ ЗАВИСИМОСТЬ (через утилиту)
      // ============================================
      // Для новой подзадачи используем временный ID (Date.now()) для проверки
      const hasCircular = hasCircularDependency(Date.now(), parentId, allSubtasks)

      if (hasCircular) {
        console.warn(`[API] ⚠️ Обнаружена циклическая зависимость`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Обнаружена циклическая зависимость: нельзя сделать подзадачу дочерней своего потомка'
        })
      }
    }

    // ============================================
    // 9. ПОЛУЧЕНИЕ СЛЕДУЮЩЕГО ПОРЯДКОВОГО НОМЕРА
    // ============================================
    const order = body.order ?? 0
    let finalOrder = order

    if (order === 0 || order === undefined) {
      // Получаем подзадачи текущего уровня для расчёта порядка
      const subtasksAtLevel = allSubtasks.filter(s =>
        s.parentId === parentId && s.taskId === taskId
      )

      const maxOrder = subtasksAtLevel.length > 0
        ? Math.max(...subtasksAtLevel.map(s => s.order ?? 0))
        : -1

      finalOrder = maxOrder + 1
    }

    console.log(`[API] 📊 Порядок подзадачи: ${finalOrder}`)

    // ============================================
    // 10. СОЗДАНИЕ ПОДЗАДАЧИ
    // ============================================
    const [newSubtask] = await db
      .insert(boardsSubtasks)
      .values({
        taskId,
        parentId,
        title: body.title.trim(),
        description: body.description?.trim() ?? null,
        order: finalOrder,
        isCompleted: false,
        completedAt: null
      })
      .$returningId()

    if (!newSubtask || !newSubtask.id) {
      console.error(`[API] ❌ Не удалось создать подзадачу: нет ID`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать подзадачу'
      })
    }
    console.log(`[API] ✅ Подзадача создана в БД: ${newSubtask.id}`)

    // ============================================
    // 11. ПОЛУЧЕНИЕ ПОЛНЫХ ДАННЫХ ПОДЗАДАЧИ
    // ============================================
    const [createdSubtaskDB] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, newSubtask.id))

    if (!createdSubtaskDB) {
      console.error(`[API] ❌ Не удалось получить созданную подзадачу`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить созданную подзадачу'
      })
    }

    // ✅ КОНВЕРТИРУЕМ В ТИП Subtask
    const subtaskForResponse: Subtask = convertToSubtaskType(createdSubtaskDB)

    // ============================================
    // 12. ОТПРАВКА SOCKET СОБЫТИЯ
    // ============================================
    const io = getIO()
    if (io && task.boardId) {
      emitSubtaskCreated(io, subtaskForResponse, task.boardId)
      console.log(`[API] 📡 Socket событие отправлено в комнату board:${task.boardId}`)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен или boardId не найден`)
    }

    // ============================================
    // 13. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Подзадача создана за ${executionTime}мс`)

    return {
      success: true,
      subtask: subtaskForResponse
    }

  } catch (error) {
    // ============================================
    // 14. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось создать подзадачу'
    })
  }
})
