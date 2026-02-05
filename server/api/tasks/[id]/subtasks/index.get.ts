// server/api/tasks/[id]/subtasks/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../../db'
import { boardsSubtasks } from '../../../../db/schema'
import { eq, and, asc } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID задачи из параметров
    const taskIdParam = event.context.params?.id

    if (!taskIdParam || isNaN(Number(taskIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }

    const taskId = Number(taskIdParam)

    // Проверяем, существует ли задача
    const [task] = await db
      .select()
      .from(db.boardsTasks)
      .where(eq(db.boardsTasks.id, taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Получаем все подзадачи задачи (рекурсивно)
    const subtasks = await getSubtasksForTask(taskId)

    return {
      subtasks,
      total: countSubtasks(subtasks)
    }
  } catch (error) {
    console.error('Error fetching subtasks:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subtasks'
    })
  }
})

// Вспомогательная функция для рекурсивного получения подзадач
async function getSubtasksForTask(taskId: number, parentId: number | null = null) {
  const subtasks = await db
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
    .where(and(
      eq(boardsSubtasks.taskId, taskId),
      parentId ? eq(boardsSubtasks.parentId, parentId) : eq(boardsSubtasks.parentId, null)
    ))
    .orderBy(asc(boardsSubtasks.order))

  // Рекурсивно получаем дочерние подзадачи
  const subtasksWithChildren = await Promise.all(
    subtasks.map(async (subtask) => {
      const children = await getSubtasksForTask(taskId, subtask.id)
      return {
        ...subtask,
        subtasks: children
      }
    })
  )

  return subtasksWithChildren
}

// Вспомогательная функция для подсчёта всех подзадач (включая вложенные)
function countSubtasks(subtasks: any[]): number {
  return subtasks.reduce((count, subtask) => {
    return count + 1 + (subtask.subtasks ? countSubtasks(subtask.subtasks) : 0)
  }, 0)
}
