// server/api/tasks/[id]/tags/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../../db'
import { boardsTasksTags } from '../../../../db/schema'
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
    const [task] = await db
      .select()
      .from(db.boardsTasks)
      .where(eq(db.boardsTasks.id, taskIdNum))

    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Задача не найдена'
      })
    }

    // Читаем тело запроса
    const body = await readBody(event)

    // Валидация тегов
    if (!body.tagIds || !Array.isArray(body.tagIds) || body.tagIds.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Необходимо указать хотя бы один tagId'
      })
    }

    // Проверяем, что все теги существуют
    const existingTags = await db
      .select()
      .from(db.boardsTags)
      .where(db.boardsTags.id.inArray(body.tagIds))

    if (existingTags.length !== body.tagIds.length) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Один или несколько тегов не найдены'
      })
    }

    // Добавляем связи тегов с задачей
    const tagRelations = body.tagIds.map((tagId: number) => ({
      taskId: taskIdNum,
      tagId: tagId
    }))

    await db
      .insert(boardsTasksTags)
      .values(tagRelations)
      .onDuplicateKeyUpdate({ set: { taskId: taskIdNum, tagId: boardsTasksTags.tagId } })

    return {
      success: true,
      message: 'Теги успешно добавлены к задаче'
    }
  } catch (error) {
    console.error('Error adding tags to task:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to add tags to task'
    })
  }
})
