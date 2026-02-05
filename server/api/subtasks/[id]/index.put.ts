// server/api/subtasks/[id]/index.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../db'
import { boardsSubtasks } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID подзадачи из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID подзадачи'
      })
    }

    const subtaskId = Number(id)

    // Проверяем, существует ли подзадача
    const [existingSubtask] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))

    if (!existingSubtask) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Подзадача не найдена'
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
          statusMessage: 'Название подзадачи не может быть пустым'
        })
      }
      updateData.title = body.title.trim()
    }

    // Обновляем описание, если передано
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    // Обновляем родительскую подзадачу, если передано
    if (body.parentId !== undefined) {
      if (body.parentId === null) {
        updateData.parentId = null
      } else if (typeof body.parentId === 'number') {
        // Проверяем, что родительская подзадача существует и принадлежит той же задаче
        const [parentSubtask] = await db
          .select()
          .from(boardsSubtasks)
          .where(eq(boardsSubtasks.id, body.parentId))

        if (!parentSubtask) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Родительская подзадача не найдена'
          })
        }

        // Проверяем, что родительская подзадача принадлежит той же задаче
        if (parentSubtask.taskId !== existingSubtask.taskId) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Родительская подзадача должна принадлежать той же задаче'
          })
        }

        // Проверяем на циклическую зависимость
        if (await hasCircularDependency(subtaskId, body.parentId)) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Обнаружена циклическая зависимость'
          })
        }

        updateData.parentId = body.parentId
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'parentId должен быть числом или null'
        })
      }
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

    // Обновляем подзадачу
    const [updatedSubtask] = await db
      .update(boardsSubtasks)
      .set(updateData)
      .where(eq(boardsSubtasks.id, subtaskId))
      .returning()

    return {
      success: true,
      subtask: updatedSubtask
    }
  } catch (error) {
    console.error('Error updating subtask:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update subtask'
    })
  }
})

// Вспомогательная функция для проверки циклической зависимости
async function hasCircularDependency(subtaskId: number, potentialParentId: number): Promise<boolean> {
  // Рекурсивно проверяем, не является ли potentialParentId потомком subtaskId
  async function checkAncestors(currentId: number): Promise<boolean> {
    const [currentSubtask] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, currentId))

    if (!currentSubtask) return false

    if (currentSubtask.parentId === subtaskId) {
      return true // Цикл обнаружен
    }

    if (currentSubtask.parentId) {
      return await checkAncestors(currentSubtask.parentId)
    }

    return false
  }

  return await checkAncestors(potentialParentId)
}
