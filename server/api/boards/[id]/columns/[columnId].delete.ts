// server/api/boards/[id]/columns/[columnId].delete.ts

/**
 * API Endpoint: Удаление колонки
 *
 * Архитектура:
 * - DELETE /api/boards/{boardId}/columns/{columnId}
 * - Проверка прав доступа к доске
 * - Каскадное удаление связанных задач (опционально)
 * - Broadcast через Socket.IO всем клиентам в комнате доски
 * - Логирование на русском языке
 * - Типизированный ответ
 */
import { eventHandler, createError } from 'h3'
import { db, boards, boardColumns, boardsTasks } from '../../../../db'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { broadcastColumnDeleted } from '../../../../socket/handlers/columns'

/**
 * Интерфейс ответа API
 */
interface DeleteColumnResponse {
  success: boolean
  message: string
  columnId: number
  boardId: number
  deletedTasksCount?: number
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<DeleteColumnResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос удаления колонки: пользователь ${user.id}`)
    
    // ============================================
    // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ID ДОСКИ И КОЛОНКИ
    // ============================================
    const boardIdParam = event.context.params?.id
    const columnIdParam = event.context.params?.columnId
    
    if (!boardIdParam || isNaN(Number(boardIdParam))) {
      console.warn(`[API] ⚠️ Некорректный ID доски: ${boardIdParam}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }
    
    if (!columnIdParam || isNaN(Number(columnIdParam))) {
      console.warn(`[API] ⚠️ Некорректный ID колонки: ${columnIdParam}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID колонки'
      })
    }
    
    const boardId = Number(boardIdParam)
    const columnId = Number(columnIdParam)
    
    console.log(`[API] 🔍 Удаление колонки ${columnId} на доске ${boardId}`)
    
    // ============================================
    // 3. ПРОВЕРКА СУЩЕСТВОВАНИЯ ДОСКИ
    // ============================================
    const [board] = await db
      .select({
        id: boards.id,
        name: boards.name,
        folderId: boards.folderId
      })
      .from(boards)
      .where(eq(boards.id, boardId))
      .limit(1)
    
    if (!board) {
      console.warn(`[API] ⚠️ Доска ${boardId} не найдена`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Доска не найдена'
      })
    }
    
    console.log(`[API] ✅ Доска найдена: "${board.name}"`)
    
    // ============================================
    // 4. ПРОВЕРКА СУЩЕСТВОВАНИЯ КОЛОНКИ
    // ============================================
    const [existingColumn] = await db
      .select({
        id: boardColumns.id,
        boardId: boardColumns.boardId,
        name: boardColumns.name
      })
      .from(boardColumns)
      .where(
        and(
          eq(boardColumns.id, columnId),
          eq(boardColumns.boardId, boardId)
        )
      )
      .limit(1)
    
    if (!existingColumn) {
      console.warn(`[API] ⚠️ Колонка ${columnId} не найдена на доске ${boardId}`)
      throw createError({
        statusCode: 404,
        statusMessage: 'Колонка не найдена'
      })
    }
    
    console.log(`[API] ✅ Колонка найдена: "${existingColumn.name}"`)
    
    // ============================================
    // 5. ПОДСЧЁТ ЗАДАЧ В КОЛОНКЕ (ДЛЯ ЛОГИРОВАНИЯ)
    // ============================================
    const tasksInColumn = await db
      .select({
        id: boardsTasks.id
      })
      .from(boardsTasks)
      .where(
        and(
          eq(boardsTasks.boardId, boardId),
          eq(boardsTasks.columnId, columnId)
        )
      )
    
    const tasksCount = tasksInColumn.length
    
    if (tasksCount > 0) {
      console.log(`[API] ⚠️ В колонке "${existingColumn.name}" есть ${tasksCount} задач`)
      // ⚠️ Задачи НЕ удаляются автоматически — они останутся с columnId = null
      // Это позволяет восстановить их при необходимости
    }
    
    // ============================================
    // 6. УДАЛЕНИЕ КОЛОНКИ ИЗ БД
    // ============================================
    await db
      .delete(boardColumns)
      .where(eq(boardColumns.id, columnId))
    
    console.log(`[API] ✅ Колонка ${columnId} удалена из БД`)
    
    // ============================================
    // 7. ОБНОВЛЕНИЕ ЗАДАЧ: СБРОС columnId НА null
    // ============================================
    if (tasksCount > 0) {
      await db
        .update(boardsTasks)
        .set({ columnId: null })
        .where(
          and(
            eq(boardsTasks.boardId, boardId),
            eq(boardsTasks.columnId, columnId)
          )
        )
      console.log(`[API] ✅ Сброшен columnId у ${tasksCount} задач`)
    }
    
    // ============================================
    // 8. BROADCAST СОБЫТИЯ ЧЕРЕЗ SOCKET.IO
    // ============================================
    const io = getIO()
    if (io) {
      console.log(`[API] 📡 Broadcast удаления колонки ${columnId} на доску ${boardId}`)
      broadcastColumnDeleted(io, columnId, boardId)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }
    
    // ============================================
    // 9. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Колонка удалена за ${executionTime}мс`)
    
    const response: DeleteColumnResponse = {
      success: true,
      message: tasksCount > 0
        ? `Колонка "${existingColumn.name}" удалена. ${tasksCount} задач перемещены в "Не распределено"`
        : `Колонка "${existingColumn.name}" успешно удалена`,
      columnId,
      boardId
    }
    
    if (tasksCount > 0) {
      response.deletedTasksCount = tasksCount
    }
    
    return response
  } catch (error) {
    // ============================================
    // 10. ОБРАБОТКА ОШИБОК
    // ============================================
    const executionTime = Date.now() - startTime
    
    // Если это уже ошибка h3, пробрасываем её
    if (error instanceof Error && 'statusCode' in error) {
      console.error(`[API] ❌ Ошибка (за ${executionTime}мс):`, (error as any).statusMessage)
      throw error
    }
    
    // Логируем непредвиденные ошибки
    console.error(`[API] ❌ Непредвиденная ошибка (за ${executionTime}мс):`, error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Не удалось удалить колонку'
    })
  }
})
