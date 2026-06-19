// server/api/boards/subtasks/[id]/complete.put.ts
/**
 * API Endpoint: Завершение/развернуть подзадачи
 *
 * Архитектура:
 * - Завершение/развернуть одну подзадачу
 * - Опциональное завершение всех дочерних подзадач
 * - Отправка socket события всем пользователям в комнате доски
 * - Логирование на русском языке
 * - Типизированный ответ
 */

import { eventHandler, createError, readBody } from 'h3'
import { db, boardsSubtasks, boardsTasks } from '../../../../db'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { emitSubtaskUpdated } from '../../../../socket/handlers/subtasks'
import type { Subtask } from '~/types/boards'

/**
 * Интерфейс тела запроса
 */
interface CompleteSubtaskBody {
  isCompleted?: boolean
  updateChildren?: boolean
}

/**
 * Интерфейс ответа API
 */
interface CompleteSubtaskResponse {
  success: boolean
  subtask: Subtask
  updatedChildren?: number
}

/**
 * ✅ Конвертировать Date в MySQL-формат для { mode: 'string' }
 */
function toMySQLDateTime(date: Date | null): string | null {
  if (!date) return null
  // Конвертируем ISO в MySQL: '2026-03-03T14:08:50.338Z' → '2026-03-03 14:08:50'
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * ✅ Конвертировать дату из БД в ISO-строку (для ответа клиенту)
 */
function convertDateToISO(date: Date | string | null | undefined): string | null {
  if (!date) return null
  if (typeof date === 'string') return date
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString()
}

/**
 * ✅ Конвертировать подзадачу из БД в тип Subtask
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
 * Рекурсивное завершение дочерних подзадач
 */
async function updateChildrenCompletion(
  parentId: number,
  isCompleted: boolean
): Promise<number> {
  const children = await db
    .select({ id: boardsSubtasks.id })
    .from(boardsSubtasks)
    .where(eq(boardsSubtasks.parentId, parentId))

  if (children.length === 0) return 0

  const childIds = children.map(c => c.id)

  // ✅ ИСПРАВЛЕНО: completedAt как MySQL-строка
  await db
    .update(boardsSubtasks)
    .set({
      isCompleted,
      completedAt: isCompleted ? toMySQLDateTime(new Date()) : null
    })
    .where(
      and(
        eq(boardsSubtasks.parentId, parentId),
        eq(boardsSubtasks.isCompleted, !isCompleted)
      )
    )

  let totalUpdated = childIds.length
  for (const child of children) {
    const grandchildrenCount = await updateChildrenCompletion(child.id, isCompleted)
    totalUpdated += grandchildrenCount
  }

  return totalUpdated
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<CompleteSubtaskResponse> => {
  const startTime = Date.now()

  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос завершения подзадачи: пользователь ${user.id}`)

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
    console.log(`[API] 🔍 Завершение подзадачи ${subtaskId}`)

    // ============================================
    // 3. ЧТЕНИЕ ТЕЛА ЗАПРОСА
    // ============================================
    const body = await readBody<CompleteSubtaskBody>(event)
    const updateChildren = body.updateChildren === true
    console.log(`[API] 📋 Параметры: isCompleted=${body.isCompleted}, updateChildren=${updateChildren}`)

    // ============================================
    // 4. ПРОВЕРКА СУЩЕСТВОВАНИЯ ПОДЗАДАЧИ
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

    const existingSubtask: Subtask = convertToSubtaskType(existingSubtaskDB)
    console.log(`[API] ✅ Подзадача найдена: "${existingSubtask.title}" (завершена: ${existingSubtask.isCompleted})`)

    // ============================================
    // 5. ОПРЕДЕЛЕНИЕ НОВОГО СТАТУСА
    // ============================================
    const newIsCompleted = body.isCompleted !== undefined
      ? body.isCompleted
      : !existingSubtask.isCompleted
    console.log(`[API] 🔄 Переключение статуса: ${existingSubtask.isCompleted} → ${newIsCompleted}`)

    // ============================================
    // 6. ОБНОВЛЕНИЕ СТАТУСА ПОДЗАДАЧИ
    // ============================================
    // ✅ ИСПРАВЛЕНО: completedAt как MySQL-строка
    const updateData: {
      isCompleted: boolean
      completedAt: string | null  // ✅ string для { mode: 'string' }
      updatedAt?: Date
    } = {
      isCompleted: newIsCompleted,
      completedAt: newIsCompleted ? toMySQLDateTime(new Date()) : null  // ✅ MySQL-формат
    }

    await db
      .update(boardsSubtasks)
      .set(updateData)
      .where(eq(boardsSubtasks.id, subtaskId))

    console.log(`[API] ✅ Статус подзадачи обновлён в БД`)

    // ============================================
    // 7. ОБНОВЛЕНИЕ ДОЧЕРНИХ ПОДЗАДАЧ (ЕСЛИ НУЖНО)
    // ============================================
    let updatedChildrenCount = 0
    if (updateChildren) {
      updatedChildrenCount = await updateChildrenCompletion(subtaskId, newIsCompleted)
      console.log(`[API] ✅ Обновлено дочерних подзадач: ${updatedChildrenCount}`)
    }

    // ============================================
    // 8. ПОЛУЧЕНИЕ ОБНОВЛЁННОЙ ПОДЗАДАЧИ
    // ============================================
    const [updatedSubtaskDB] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))

    if (!updatedSubtaskDB) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить обновлённую подзадачу'
      })
    }

    const updatedSubtask: Subtask = convertToSubtaskType(updatedSubtaskDB)

    // ============================================
    // 9. ПОЛУЧЕНИЕ ID ДОСКИ ЧЕРЕЗ ЗАДАЧУ
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
    // 10. ОТПРАВКА SOCKET СОБЫТИЯ
    // ============================================
    const io = getIO()
    if (io) {
      emitSubtaskUpdated(io, updatedSubtask, boardId)
      console.log(`[API] 📡 Socket событие отправлено в комнату board:${boardId}`)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }

    // ============================================
    // 11. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Подзадача завершена за ${executionTime}мс`)

    const response: CompleteSubtaskResponse = {
      success: true,
      subtask: updatedSubtask
    }
    if (updateChildren) {
      response.updatedChildren = updatedChildrenCount
    }

    return response

  } catch (error) {
    // ============================================
    // 12. ОБРАБОТКА ОШИБОК
    // ============================================
    const executionTime = Date.now() - startTime

    if (error instanceof Error && 'statusCode' in error) {
      console.error(`[API] ❌ Ошибка (за ${executionTime}мс):`, (error as any).statusMessage)
      throw error
    }

    console.error(`[API] ❌ Непредвиденная ошибка (за ${executionTime}мс):`, error)

    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось изменить статус подзадачи'
    })
  }
})
