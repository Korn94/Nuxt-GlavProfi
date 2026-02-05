// server/api/tasks/[id]/attachments/index.get.ts
import { eventHandler, createError } from 'h3'
import { db, boardsTasks, boardsAttachments, users } from '../../../../db'
import { eq, asc } from 'drizzle-orm'
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

    // Получаем все вложения задачи
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

    // Получаем информацию о пользователях, загрузивших файлы
    const attachmentsWithUsers = await Promise.all(
      attachments.map(async (attachment) => {
        const [uploader] = await db
          .select({
            id: users.id,
            name: users.name,
            login: users.login
          })
          .from(users)
          .where(eq(users.id, attachment.uploadedBy))

        return {
          ...attachment,
          uploadedByUser: uploader || null
        }
      })
    )

    return {
      attachments: attachmentsWithUsers,
      total: attachmentsWithUsers.length
    }
  } catch (error) {
    console.error('Error fetching attachments:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch attachments'
    })
  }
})
