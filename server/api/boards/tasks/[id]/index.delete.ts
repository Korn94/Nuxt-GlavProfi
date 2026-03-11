// server/api/boards/tasks/[id]/index.delete.ts

import { eventHandler, createError } from 'h3'
import { db, boardsTasks } from '../../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
// ✅ ИМПОРТИРУЕМ broadcast-функцию
import { broadcastTaskDeleted } from '../../../../socket/handlers/tasks'

export default eventHandler(async (event) => {
  try {
    const user = await verifyAuth(event)
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({ statusCode: 400, statusMessage: 'Некорректный ID задачи' })
    }

    const taskId = Number(id)
    const [existingTask] = await db.select({ id: boardsTasks.id, boardId: boardsTasks.boardId })
      .from(boardsTasks).where(eq(boardsTasks.id, taskId))

    if (!existingTask) {
      throw createError({ statusCode: 404, statusMessage: 'Задача не найдена' })
    }

    const boardId = existingTask.boardId

    await db.delete(boardsTasks).where(eq(boardsTasks.id, taskId))

    // ✅ BROADCAST через io.to()
    const io = getIO()
    if (io) {
      broadcastTaskDeleted(io, taskId, boardId)
    }

    return { success: true, message: 'Задача удалена', boardId }
    
  } catch (error) {
    console.error('Error deleting task:', error)
    if (error instanceof Error && 'statusCode' in error) throw error
    throw createError({ statusCode: 500, statusMessage: 'Failed to delete task' })
  }
})
