// server/api/boards/[id]/tasks/order.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db, boardsTasks } from '../../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    const user = await verifyAuth(event)
    
    const boardIdParam = event.context.params?.id
    if (!boardIdParam || isNaN(Number(boardIdParam))) {
      throw createError({ statusCode: 400, statusMessage: 'Некорректный ID доски' })
    }
    
    const boardId = Number(boardIdParam)
    const body = await readBody(event)
    
    if (!body.updates || !Array.isArray(body.updates)) {
      throw createError({ statusCode: 400, statusMessage: 'Некорректные данные' })
    }
    
    // ✅ ПАКЕТНОЕ ОБНОВЛЕНИЕ ВСЕХ ЗАДАЧ
    for (const update of body.updates) {
      await db
        .update(boardsTasks)
        .set({ order: update.order })
        .where(eq(boardsTasks.id, update.id))
    }
    
    // ✅ ОТПРАВЛЯЕМ СОКЕТ-СОБЫТИЕ ОБНОВЛЕНИЯ ВСЕХ ЗАДАЧ
    const io = event.context.nitro?.io
    if (io) {
      // Получаем обновлённые задачи
      const updatedTasks = await db
        .select()
        .from(boardsTasks)
        .where(eq(boardsTasks.boardId, boardId))
        .orderBy(boardsTasks.order)
      
      io.to(`board:${boardId}`).emit(`board:${boardId}:tasks:updated`, { 
        tasks: updatedTasks 
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error updating tasks order:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to update tasks order' })
  }
})
