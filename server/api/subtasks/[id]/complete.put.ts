// server/api/subtasks/[id]/complete.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db, boardsSubtasks } from '../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'
import { handleSubtaskUpdate } from '../../../socket/handlers/subtasks'
import { getIO } from '../../../plugins/socket.io'

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
    
    // ✅ СОХРАНЯЕМ ДАННЫЕ ДЛЯ СОКЕТА
    const taskId = existingSubtask.taskId
    
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
    
    // ✅ ОБНОВЛЯЕМ ПОДЗАДАЧУ
    await db
      .update(boardsSubtasks)
      .set(updateData)
      .where(eq(boardsSubtasks.id, subtaskId))
    
    // ✅ ПОЛУЧАЕМ ОБНОВЛЁННУЮ ПОДЗАДАЧУ ОТДЕЛЬНЫМ ЗАПРОСОМ
    const [updatedSubtask] = await db
      .select()
      .from(boardsSubtasks)
      .where(eq(boardsSubtasks.id, subtaskId))
    
    if (!updatedSubtask) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить обновлённую подзадачу'
      })
    }
    
    // ✅ КОНВЕРТИРУЕМ ДАТЫ В СТРОКИ И ГАРАНТИРУЕМ НЕ-NULL ЗНАЧЕНИЯ
    const subtaskForResponse = {
      ...updatedSubtask,
      createdAt: updatedSubtask.createdAt
        ? new Date(updatedSubtask.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: updatedSubtask.updatedAt
        ? new Date(updatedSubtask.updatedAt).toISOString()
        : new Date().toISOString(),
      completedAt: updatedSubtask.completedAt || null
    }
    
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
    
    // ✅ ОТПРАВЛЯЕМ СОКЕТ-СОБЫТИЕ
    const io = getIO()
    if (io) {
      handleSubtaskUpdate(io, subtaskId, subtaskForResponse, taskId)
    }
    
    return {
      success: true,
      subtask: subtaskForResponse
    }
  } catch (error) {
    console.error('Error completing subtask:', error)
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to complete subtask'
    })
  }
})
