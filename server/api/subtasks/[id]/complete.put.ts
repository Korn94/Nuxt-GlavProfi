// server/api/subtasks/[id]/complete.put.ts
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

    // Определяем новый статус
    const newStatus = body.isCompleted !== undefined ? body.isCompleted : !existingSubtask.isCompleted

    // Обновляем статус подзадачи
    const updateData: any = {
      isCompleted: newStatus
    }

    // Если завершаем, устанавливаем дату завершения
    if (newStatus && !existingSubtask.completedAt) {
      updateData.completedAt = new Date().toISOString().split('T')[0]
    }

    // Если развернули, сбрасываем дату завершения
    if (!newStatus && existingSubtask.completedAt) {
      updateData.completedAt = null
    }

    // Обновляем подзадачу
    const [updatedSubtask] = await db
      .update(boardsSubtasks)
      .set(updateData)
      .where(eq(boardsSubtasks.id, subtaskId))
      .returning()

    // Если у подзадачи есть дочерние подзадачи, обновляем их статус
    if (body.updateChildren === true) {
      if (newStatus) {
        // Завершаем все дочерние подзадачи
        await db
          .update(boardsSubtasks)
          .set({
            isCompleted: true,
            completedAt: new Date().toISOString().split('T')[0]
          })
          .where(eq(boardsSubtasks.parentId, subtaskId))
      } else {
        // Развернуваем все дочерние подзадачи
        await db
          .update(boardsSubtasks)
          .set({
            isCompleted: false,
            completedAt: null
          })
          .where(eq(boardsSubtasks.parentId, subtaskId))
      }
    }

    return {
      success: true,
      subtask: updatedSubtask
    }
  } catch (error) {
    console.error('Error completing subtask:', error)
    
    if ('statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to complete subtask'
    })
  }
})
