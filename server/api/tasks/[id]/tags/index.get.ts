// server/api/tasks/[id]/tags/index.get.ts
import { eventHandler, createError } from 'h3'
import { db, boardsTasks } from '../../../../db'
import { boardsTasksTags, boardsTags } from '../../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID задачи из параметров
    const taskId = event.context.params?.id

    if (!taskId || isNaN(Number(taskId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID задачи'
      })
    }

    const taskIdNum = Number(taskId)

    // Проверяем, существует ли задача
    const [task] = await db.select().from(boardsTasks).where(eq(boardsTasks.id, taskIdNum))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Получаем теги задачи
    const tags = await db
      .select({
        id: boardsTags.id,
        name: boardsTags.name,
        color: boardsTags.color,
        createdAt: boardsTags.createdAt
      })
      .from(boardsTasksTags)
      .innerJoin(boardsTags, eq(boardsTasksTags.tagId, boardsTags.id))
      .where(eq(boardsTasksTags.taskId, taskIdNum))

    return {
      tags,
      total: tags.length
    }
  } catch (error) {
    console.error('Error fetching task tags:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch task tags'
    })
  }
})
