// server/api/tasks/[id]/subtasks/index.get.ts
import { eventHandler, createError } from 'h3'
import { db, boardsTasks, boardsSubtasks } from '../../../../db'
import { eq, and, asc, isNull } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

// Тип для подзадачи с вложенными подзадачами
interface SubtaskWithChildren {
  id: number
  taskId: number
  parentId: number | null
  title: string
  description: string | null
  isCompleted: boolean
  completedAt: string | null
  order: number
  createdAt: Date | null
  updatedAt: Date
  subtasks: SubtaskWithChildren[]
}

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
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))

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
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subtasks'
    })
  }
})

// Вспомогательная функция для рекурсивного получения подзадач
async function getSubtasksForTask(taskId: number, parentId: number | null = null): Promise<SubtaskWithChildren[]> {
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
      parentId !== null ? eq(boardsSubtasks.parentId, parentId) : isNull(boardsSubtasks.parentId)
    ))
    .orderBy(asc(boardsSubtasks.order))

  // Рекурсивно получаем дочерние подзадачи
  const subtasksWithChildren: SubtaskWithChildren[] = await Promise.all(
    subtasks.map(async (subtask) => {
      const children: SubtaskWithChildren[] = await getSubtasksForTask(taskId, subtask.id)
      return {
        ...subtask,
        subtasks: children
      }
    })
  )

  return subtasksWithChildren
}

// Вспомогательная функция для подсчёта всех подзадач (включая вложенные)
function countSubtasks(subtasks: SubtaskWithChildren[]): number {
  return subtasks.reduce((count, subtask) => {
    return count + 1 + (subtask.subtasks ? countSubtasks(subtask.subtasks) : 0)
  }, 0)
}
