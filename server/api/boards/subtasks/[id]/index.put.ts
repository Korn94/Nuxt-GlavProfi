// server/api/boards/subtasks/[id]/index.put.ts
/**
 * API Endpoint: Обновление подзадачи
 *
 * Архитектура:
 * - Обновление данных подзадачи с валидацией
 * - Проверка максимальной глубины вложенности (5 уровней)
 * - Проверка на циклическую зависимость при смене родителя
 * - Отправка socket события всем пользователям в комнате доски
 * - Логирование на русском языке
 * - Типизированный ответ
 * - ✅ Использует централизованные утилиты из ~/utils/subtasks
 */

import { eventHandler, createError, readBody } from 'h3'
import { db, boardsSubtasks, boardsTasks } from '../../../../db'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { emitSubtaskUpdated } from '../../../../socket/handlers/subtasks'
import type { Subtask } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

// ✅ ИМПОРТ ЦЕНТРАЛИЗОВАННЫХ УТИЛИТ
import {
  calculateSubtaskDepth,
  hasCircularDependency,
  validateParentChange,
  validateUpdateSubtaskData,
  sortSubtasksByOrder
} from '../../../../utils/subtasks'

/**
 * Интерфейс тела запроса
 */
interface UpdateSubtaskBody {
  title?: string
  description?: string | null
  parentId?: number | null
  order?: number
  isCompleted?: boolean
}

/**
 * Интерфейс ответа API
 */
interface UpdateSubtaskResponse {
  success: boolean
  subtask: Subtask
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
export default eventHandler(async (event): Promise<UpdateSubtaskResponse> => {
  const startTime = Date.now()

  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос обновления подзадачи: пользователь ${user.id}`)

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
    console.log(`[API] 🔍 Обновление подзадачи ${subtaskId}`)

    // ============================================
    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОДЗАДАЧИ
    // ============================================
    const [existingSubtaskDB] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
      .limit(1)

    if (!existingSubtaskDB) {
      console.warn(`[API] ⚠️ Подзадача ${subtaskId} не найдена`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Подзадача не найдена'
      })
    }

    // ✅ КОНВЕРТИРУЕМ В ТИП Subtask
    const existingSubtask: Subtask = convertToSubtaskType(existingSubtaskDB)
    console.log(`[API] ✅ Подзадача найдена: "${existingSubtask.title}"`)

    // ============================================
    // 4. ЗАГРУЗКА ВСЕХ ПОДЗАДАЧ ЗАДАЧИ (ДЛЯ ВАЛИДАЦИИ)
    // ============================================
    // ✅ Загружаем flat-список для использования в утилитах
    const allSubtasksDB = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.taskId, existingSubtask.taskId))

    // ✅ КОНВЕРТИРУЕМ ДАТЫ СРАЗУ ПОСЛЕ ЗАГРУЗКИ
    const allSubtasks: Subtask[] = allSubtasksDB.map(convertToSubtaskType)

    // ============================================
    // 5. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
    // ============================================
    const body = await readBody<UpdateSubtaskBody>(event)

    // Проверка что есть данные для обновления
    if (Object.keys(body).length === 0) {
      console.warn(`[API] ⚠️ Нет данных для обновления`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления'
      })
    }

    // ✅ Используем централизованную валидацию
    const validation = validateUpdateSubtaskData(body, existingSubtask, allSubtasks)
    if (!validation.valid) {
      console.warn(`[API] ⚠️ Ошибка валидации: ${validation.errors.join(', ')}`)
      throw createError({
        statusCode: 400,
        statusMessage: validation.errors.join('; ')
      })
    }

    // ============================================
    // 6. ПОДГОТОВКА ДАННЫХ ДЛЯ ОБНОВЛЕНИЯ
    // ============================================
    const updateData: Record<string, any> = {}

    // Обновление названия
    if (body.title !== undefined) {
      updateData.title = body.title.trim()
    }

    // Обновление описания
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    // Обновление родительской подзадачи
    if (body.parentId !== undefined) {
      const newParentId = body.parentId ?? null

      // Если parentId не изменился, пропускаем проверки
      if (newParentId !== existingSubtask.parentId) {
        if (newParentId !== null) {
          // Проверяем существование родительской подзадачи
          const [parentSubtask] = await db
            .select({
              id: boardsSubtasks.id,
              taskId: boardsSubtasks.taskId,
              parentId: boardsSubtasks.parentId
            })
            .from(boardsSubtasks)
            .where(eq(boardsSubtasks.id, newParentId))
            .limit(1)

          if (!parentSubtask) {
            console.warn(`[API] ⚠️ Родительская подзадача ${newParentId} не найдена`)
            throw createError({
              statusCode: 400,
              statusMessage: 'Родительская подзадача не найдена'
            })
          }

          // Проверяем что родительская подзадача принадлежит той же задаче
          if (parentSubtask.taskId !== existingSubtask.taskId) {
            console.warn(`[API] ⚠️ Родительская подзадача принадлежит другой задаче`)
            throw createError({
              statusCode: 400,
              statusMessage: 'Родительская подзадача должна принадлежать той же задаче'
            })
          }

          // ============================================
          // 7. ПРОВЕРКА МАКСИМАЛЬНОЙ ГЛУБИНЫ (через утилиту)
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
          // 8. ПРОВЕРКА НА ЦИКЛИЧЕСКУЮ ЗАВИСИМОСТЬ (через утилиту)
          // ============================================
          const hasCircular = hasCircularDependency(subtaskId, newParentId, allSubtasks)

          if (hasCircular) {
            console.warn(`[API] ⚠️ Обнаружена циклическая зависимость`)
            throw createError({
              statusCode: 400,
              statusMessage: 'Обнаружена циклическая зависимость: нельзя сделать подзадачу дочерней своего потомка'
            })
          }
        }
      }
      updateData.parentId = newParentId
    }

    // Обновление порядка
    if (body.order !== undefined) {
      updateData.order = body.order
    }

    // Обновление статуса завершения
    if (body.isCompleted !== undefined) {
      updateData.isCompleted = body.isCompleted
      // Если завершаем, устанавливаем дату завершения
      if (body.isCompleted && !existingSubtask.isCompleted) {
        updateData.completedAt = new Date()
      }
      // Если развернули, сбрасываем дату завершения
      if (!body.isCompleted && existingSubtask.isCompleted) {
        updateData.completedAt = null
      }
    }

    // Если после всех проверок нет данных для обновления
    if (Object.keys(updateData).length === 0) {
      console.warn(`[API] ⚠️ Нет данных для обновления после валидации`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления'
      })
    }

    // ============================================
    // 9. ОБНОВЛЕНИЕ ПОДЗАДАЧИ В БД
    // ============================================
    // Добавляем updatedAt
    updateData.updatedAt = new Date()

    await db
      .update(boardsSubtasks)
      .set(updateData)
      .where(eq(boardsSubtasks.id, subtaskId))

    console.log(`[API] ✅ Подзадача обновлена в БД`)

    // ============================================
    // 10. ПОЛУЧЕНИЕ ОБНОВЛЁННОЙ ПОДЗАДАЧИ
    // ============================================
    const [updatedSubtaskDB] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))

    if (!updatedSubtaskDB) {
      console.error(`[API] ❌ Не удалось получить обновлённую подзадачу`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить обновлённую подзадачу'
      })
    }

    // ✅ КОНВЕРТИРУЕМ В ТИП Subtask
    const updatedSubtask: Subtask = convertToSubtaskType(updatedSubtaskDB)

    // ============================================
    // 11. ПОЛУЧЕНИЕ ID ДОСКИ ЧЕРЕЗ ЗАДАЧУ
    // ============================================
    const [task] = await db
      .select({ boardId: boardsTasks.boardId })
      .from(boardsTasks)
      .where(eq(boardsTasks.id, updatedSubtask.taskId))
      .limit(1)

    if (!task?.boardId) {
      console.warn(`[API] ⚠️ Не удалось получить boardId для задачи ${updatedSubtask.taskId}`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось определить доску'
      })
    }
    const boardId = task.boardId
    console.log(`[API] 📋 Board ID: ${boardId}`)

    // ============================================
    // 12. ОТПРАВКА SOCKET СОБЫТИЯ
    // ============================================
    const io = getIO()
    if (io) {
      emitSubtaskUpdated(io, updatedSubtask, boardId)
      console.log(`[API] 📡 Socket событие отправлено в комнату board:${boardId}`)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }

    // ============================================
    // 13. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Подзадача обновлена за ${executionTime}мс`)

    return {
      success: true,
      subtask: updatedSubtask
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
      statusMessage: 'Не удалось обновить подзадачу'
    })
  }
})
