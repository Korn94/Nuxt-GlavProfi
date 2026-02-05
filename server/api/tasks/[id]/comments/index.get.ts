// server/api/tasks/[id]/comments/index.get.ts
import { eventHandler, createError } from 'h3'
import { db } from '../../../../db'
import { boardsComments, users } from '../../../../db/schema'
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

    // Получаем все комментарии задачи (рекурсивно)
    const comments = await getCommentsForTask(taskId)

    return {
      comments,
      total: countComments(comments)
    }
  } catch (error) {
    console.error('Error fetching comments:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch comments'
    })
  }
})

// Вспомогательная функция для рекурсивного получения комментариев
async function getCommentsForTask(taskId: number, parentId: number | null = null) {
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
      parentId ? eq(boardsComments.parentId, parentId) : eq(boardsComments.parentId, null)
    ))
    .orderBy(asc(boardsComments.createdAt))

  // Получаем информацию о пользователях
  const commentsWithUsers = await Promise.all(
    comments.map(async (comment) => {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          login: users.login
        })
        .from(users)
        .where(eq(users.id, comment.userId))

      return {
        ...comment,
        user: user || null
      }
    })
  )

  // Рекурсивно получаем дочерние комментарии (ответы)
  const commentsWithReplies = await Promise.all(
    commentsWithUsers.map(async (comment) => {
      const replies = await getCommentsForTask(taskId, comment.id)
      return {
        ...comment,
        replies
      }
    })
  )

  return commentsWithReplies
}

// Вспомогательная функция для подсчёта всех комментариев (включая ответы)
function countComments(comments: any[]): number {
  return comments.reduce((count, comment) => {
    return count + 1 + (comment.replies ? countComments(comment.replies) : 0)
  }, 0)
}
