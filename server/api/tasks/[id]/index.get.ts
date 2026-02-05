// server/api/tasks/[id]/index.get.ts
import { eventHandler, createError } from 'h3'
import { db, boardsTasks, boardsSubtasks, boardsTasksTags, boardsTags, boardsAttachments, boardsComments } from '../../../db'
import { eq, and, asc, isNull } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

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

// Тип для комментария с ответами
interface CommentWithReplies {
  id: number
  taskId: number
  userId: number
  comment: string
  parentId: number | null
  createdAt: Date | null
  updatedAt: Date
  replies: CommentWithReplies[]
}

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID задачи из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }

    const taskId = Number(id)

    // Получаем задачу
    const [task] = await db
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
      .where(eq(boardsTasks.id, taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Получаем подзадачи первого уровня
    const subtasks = await getSubtasksForTask(taskId)

    // Получаем теги задачи
    const tags = await db
      .select({
        id: boardsTags.id,
        name: boardsTags.name,
        color: boardsTags.color
      })
      .from(boardsTasksTags)
      .innerJoin(boardsTags, eq(boardsTasksTags.tagId, boardsTags.id))
      .where(eq(boardsTasksTags.taskId, taskId))

    // Получаем вложения
    const attachments = await db
      .select({
        id: boardsAttachments.id,
        taskId: boardsAttachments.taskId,
        fileUrl: boardsAttachments.fileUrl,
        fileType: boardsAttachments.fileType,
        fileName: boardsAttachments.fileName,
        fileSize: boardsAttachments.fileSize,
        uploadedBy: boardsAttachments.uploadedBy,
        createdAt: boardsAttachments.createdAt
      })
      .from(boardsAttachments)
      .where(eq(boardsAttachments.taskId, taskId))
      .orderBy(asc(boardsAttachments.createdAt))

    // Получаем комментарии первого уровня
    const comments = await getCommentsForTask(taskId)

    return {
      task: {
        ...task,
        subtasks,
        tags,
        attachments,
        comments
      }
    }
  } catch (error) {
    console.error('Error fetching task:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch task'
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

// Вспомогательная функция для рекурсивного получения комментариев
async function getCommentsForTask(taskId: number, parentId: number | null = null): Promise<CommentWithReplies[]> {
  const comments = await db
    .select({
      id: boardsComments.id,
      taskId: boardsComments.taskId,
      userId: boardsComments.userId,
      comment: boardsComments.comment,
      parentId: boardsComments.parentId,
      createdAt: boardsComments.createdAt,
      updatedAt: boardsComments.updatedAt
    })
    .from(boardsComments)
    .where(and(
      eq(boardsComments.taskId, taskId),
      parentId !== null ? eq(boardsComments.parentId, parentId) : isNull(boardsComments.parentId)
    ))
    .orderBy(asc(boardsComments.createdAt))

  // Рекурсивно получаем дочерние комментарии (ответы)
  const commentsWithReplies: CommentWithReplies[] = await Promise.all(
    comments.map(async (comment) => {
      const replies: CommentWithReplies[] = await getCommentsForTask(taskId, comment.id)
      return {
        ...comment,
        replies
      }
    })
  )

  return commentsWithReplies
}
