// server/api/tasks/[id]/comments/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db, boardsTasks, boardsComments } from '../../../../db'
import { eq, desc } from 'drizzle-orm'
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
      .from(boardsTasks)
      .where(eq(boardsTasks.id, taskId))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидация обязательных полей
    if (!body.comment || typeof body.comment !== 'string' || body.comment.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Текст комментария обязателен'
      })
    }

    // Подготавливаем данные для вставки
    const commentData: any = {
      taskId: taskId,
      userId: user.id,
      comment: body.comment.trim(),
      parentId: body.parentId || null
    }

    // Если указан parentId, проверяем, что родительский комментарий существует
    if (commentData.parentId) {
      const [parentComment] = await db
        .select()
        .from(boardsComments)
        .where(eq(boardsComments.id, commentData.parentId))

      if (!parentComment) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Родительский комментарий не найден'
        })
      }

      // Проверяем, что родительский комментарий принадлежит той же задаче
      if (parentComment.taskId !== taskId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Родительский комментарий должен принадлежать той же задаче'
        })
      }
    }

    // Создаём комментарий
    await db
      .insert(boardsComments)
      .values(commentData)

    // Получаем только что созданный комментарий
    const newComments = await db
      .select()
      .from(boardsComments)
      .where(eq(boardsComments.taskId, taskId))
      .orderBy(desc(boardsComments.id))
      .limit(1)

    const newComment = newComments[0]

    return {
      success: true,
      comment: newComment
    }
  } catch (error) {
    console.error('Error creating comment:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create comment'
    })
  }
})
