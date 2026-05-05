// server/api/boards/[id]/columns/index.get.ts

/**
 * API Endpoint: Получение всех колонок доски
 *
 * Архитектура:
 * - GET /api/boards/{boardId}/columns
 * - Проверка доступа к доске
 * - Возвращает все колонки отсортированные по order
 * - Логирование на русском языке
 * - Типизированный ответ
 */
import { eventHandler, createError } from 'h3'
import { db, boards, boardColumns } from '../../../../db'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/permissions'
import type { BoardColumn } from '~/types/boards'

/**
 * Интерфейс ответа API
 */
interface GetColumnsResponse {
  success: boolean
  columns: BoardColumn[]
  total: number
  boardId: number
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<GetColumnsResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await requireAuth(event)
    console.log(`[API] 📥 Запрос колонок: пользователь ${user.id}`)
    
    // ============================================
    // 2. ПОЛУЧЕНИЕ И ВАЛИДАЦИЯ ID ДОСКИ
    // ============================================
    const boardIdParam = event.context.params?.id
    if (!boardIdParam || isNaN(Number(boardIdParam))) {
      console.warn(`[API] ⚠️ Некорректный ID доски: ${boardIdParam}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }
    
    const boardId = Number(boardIdParam)
    console.log(`[API] 🔍 Получение колонок для доски ${boardId}`)
    
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
    // 4. ПОЛУЧЕНИЕ ВСЕХ КОЛОНОК ДОСКИ
    // ============================================
    const columns = await db
      .select({
        id: boardColumns.id,
        boardId: boardColumns.boardId,
        name: boardColumns.name,
        order: boardColumns.order,
        createdAt: boardColumns.createdAt,
        updatedAt: boardColumns.updatedAt
      })
      .from(boardColumns)
      .where(eq(boardColumns.boardId, boardId))
      .orderBy(boardColumns.order)
    
    console.log(`[API] 📊 Найдено колонок: ${columns.length}`)
    
    // ============================================
    // 5. КОНВЕРТАЦИЯ ДАТ В ISO-СТРОКИ
    // ============================================
    const columnsForResponse: BoardColumn[] = columns.map(column => ({
      id: column.id,
      boardId: column.boardId,
      name: column.name,
      order: column.order ?? 0,
      createdAt: column.createdAt
        ? new Date(column.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: column.updatedAt
        ? new Date(column.updatedAt).toISOString()
        : new Date().toISOString()
    }))
    
    // ============================================
    // 6. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Колонки получены за ${executionTime}мс`)
    
    return {
      success: true,
      columns: columnsForResponse,
      total: columnsForResponse.length,
      boardId
    }
  } catch (error) {
    // ============================================
    // 7. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось получить колонки'
    })
  }
})
