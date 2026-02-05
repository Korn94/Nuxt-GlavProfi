// server/api/boards/[id]/tasks/index.get.ts
import { eventHandler, createError } from 'h3'
import { db, boards, boardsTasks, boardsSubtasks, boardsTasksTags, boardsTags } from '../../../../db'
import { eq, and, desc, asc, isNull } from 'drizzle-orm'
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

    // Получаем ID доски из параметров
    const boardIdParam = event.context.params?.id

    if (!boardIdParam || isNaN(Number(boardIdParam))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }

    const boardId = Number(boardIdParam)

    // Проверяем, существует ли доска
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))

    if (!board) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Доска не найдена'
      })
    }

    // Получаем все задачи доски
    const tasks = await db
      .select({
        id: boardsTasks.id,
        boardId: boardsTasks.boardId,
        title: boardsTasks.title,
        description: boardsTasks.description,
        status: boardsTasks.status,
        priority: boardsTasks.priority,
        assignedTo: boardsTasks.assignedTo,
        dueDate: boardsTasks.dueDate,
        completedDate: boardsTasks.completedDate,
        order: boardsTasks.order,
        createdBy: boardsTasks.createdBy,
        createdAt: boardsTasks.createdAt,
        updatedAt: boardsTasks.updatedAt
      })
      .from(boardsTasks)
      .where(eq(boardsTasks.boardId, boardId))
      .orderBy(
        desc(boardsTasks.priority), // Сначала по приоритету
        asc(boardsTasks.order)      // Затем по порядку
      )

    // Получаем подзадачи для каждой задачи
    const tasksWithSubtasks = await Promise.all(
      tasks.map(async (task) => {
        // Получаем подзадачи первого уровня (без родителя)
        const subtasks = await getSubtasksForTask(task.id)
        return {
          ...task,
          subtasks
        }
      })
    )

    // Функция для рекурсивного получения подзадач
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

    // Получаем теги для всех задач
    const tasksWithTags = await Promise.all(
      tasksWithSubtasks.map(async (task) => {
        // Получаем теги задачи
        const taskTags = await db
          .select({
            id: boardsTags.id,
            name: boardsTags.name,
            color: boardsTags.color
          })
          .from(boardsTasksTags)
          .innerJoin(boardsTags, eq(boardsTasksTags.tagId, boardsTags.id))
          .where(eq(boardsTasksTags.taskId, task.id))

        return {
          ...task,
          tags: taskTags
        }
      })
    )

    return {
      tasks: tasksWithTags,
      total: tasksWithTags.length
    }
  } catch (error) {
    console.error('Error fetching tasks:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tasks'
    })
  }
})
