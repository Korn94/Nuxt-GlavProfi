// server/api/boards/[id]/columns/order.put.ts

/**
 * API Endpoint: Пакетное изменение порядка колонок
 *
 * Архитектура:
 * - PUT /api/boards/{boardId}/columns/order
 * - Проверка прав доступа к доске
 * - Пакетное обновление order для всех колонок
 * - Broadcast через Socket.IO всем клиентам в комнате доски
 * - Логирование на русском языке
 * - Типизированный ответ
 */
import { eventHandler, createError, readBody } from 'h3'
import { db, boards, boardColumns } from '../../../../db'
import { eq, inArray } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { broadcastColumnsReordered } from '../../../../socket/handlers/columns'

/**
 * Интерфейс элемента обновления порядка
 */
interface ReorderItem {
  id: number
  order: number
}

/**
 * Интерфейс тела запроса
 */
interface ReorderColumnsBody {
  updates: ReorderItem[]
}

/**
 * Интерфейс ответа API
 */
interface ReorderColumnsResponse {
  success: boolean
  message: string
  boardId: number
  updated: number
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<ReorderColumnsResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос изменения порядка колонок: пользователь ${user.id}`)
    
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
    console.log(`[API] 🔍 Изменение порядка колонок для доски ${boardId}`)
    
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
    // 4. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
    // ============================================
    const body = await readBody<ReorderColumnsBody>(event)
    
    // Проверка наличия массива updates
    if (!body.updates || !Array.isArray(body.updates)) {
      console.warn(`[API] ⚠️ Неверный формат данных: ожидается массив updates`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Неверный формат данных: ожидается массив updates'
      })
    }
    
    if (body.updates.length === 0) {
      console.warn(`[API] ⚠️ Пустой массив обновлений`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Массив обновлений не может быть пустым'
      })
    }
    
    console.log(`[API] 📊 Получено ${body.updates.length} обновлений порядка`)
    
    // ============================================
    // 5. ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
    // ============================================
    const columnIds = body.updates.map(u => u.id)
    
    // Проверка на дубликаты ID
    const uniqueIds = new Set(columnIds)
    if (uniqueIds.size !== columnIds.length) {
      console.warn(`[API] ⚠️ Обнаружены дубликаты ID в запросе`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Обнаружены дубликаты ID колонок'
      })
    }
    
    // Валидация каждого элемента
    for (const update of body.updates) {
      if (typeof update.id !== 'number' || typeof update.order !== 'number') {
        console.warn(`[API] ⚠️ Неверный формат элемента обновления`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Каждый элемент должен содержать поля id (number) и order (number)'
        })
      }
      
      if (update.order < 0) {
        console.warn(`[API] ⚠️ Отрицательный порядок для колонки ${update.id}`)
        throw createError({
          statusCode: 400,
          statusMessage: 'Порядок колонки не может быть отрицательным'
        })
      }
    }
    
    // ============================================
    // 6. ПРОВЕРКА СУЩЕСТВОВАНИЯ ВСЕХ КОЛОНОК
    // ============================================
    const existingColumns = await db
      .select({
        id: boardColumns.id,
        boardId: boardColumns.boardId
      })
      .from(boardColumns)
      .where(
        inArray(boardColumns.id, columnIds)
      )
    
    if (existingColumns.length !== columnIds.length) {
      const foundIds = new Set(existingColumns.map(c => c.id))
      const missingIds = columnIds.filter(id => !foundIds.has(id))
      console.warn(`[API] ⚠️ Не найдены колонки: ${missingIds.join(', ')}`)
      throw createError({
        statusCode: 404,
        statusMessage: `Не найдены колонки с ID: ${missingIds.join(', ')}`
      })
    }
    
    // Проверка что все колонки принадлежат этой доске
    const wrongBoard = existingColumns.find(c => c.boardId !== boardId)
    if (wrongBoard) {
      console.warn(`[API] ⚠️ Колонка ${wrongBoard.id} не принадлежит доске ${boardId}`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Все колонки должны принадлежать одной доске'
      })
    }
    
    console.log(`[API] ✅ Все колонки найдены и принадлежат доске ${boardId}`)
    
    // ============================================
    // 7. ПАКЕТНОЕ ОБНОВЛЕНИЕ ПОРЯДКА В БД
    // ============================================
    // Выполняем обновления в цикле (для простоты и читаемости)
    for (const update of body.updates) {
      await db
        .update(boardColumns)
        .set({
          order: update.order,
          updatedAt: new Date()
        })
        .where(eq(boardColumns.id, update.id))
    }
    
    console.log(`[API] ✅ Порядок ${body.updates.length} колонок обновлён в БД`)
    
    // ============================================
    // 8. ПОЛУЧЕНИЕ ОБНОВЛЁННЫХ КОЛОНОК (ДЛЯ BROADCAST)
    // ============================================
    const updatedColumns = await db
      .select({
        id: boardColumns.id,
        boardId: boardColumns.boardId,
        name: boardColumns.name,
        order: boardColumns.order,
        createdAt: boardColumns.createdAt,
        updatedAt: boardColumns.updatedAt
      })
      .from(boardColumns)
      .where(inArray(boardColumns.id, columnIds))
      .orderBy(boardColumns.order)
    
    // Конвертация дат в ISO-строки
    const columnsForResponse = updatedColumns.map(column => ({
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
    // 9. BROADCAST СОБЫТИЯ ЧЕРЕЗ SOCKET.IO
    // ============================================
    const io = getIO()
    if (io) {
      console.log(`[API] 📡 Broadcast изменения порядка колонок на доску ${boardId}`)
      broadcastColumnsReordered(io, boardId, columnsForResponse)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }
    
    // ============================================
    // 10. ЛОГИРОВАНИЕ И ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Порядок колонок изменён за ${executionTime}мс`)
    
    return {
      success: true,
      message: `Порядок ${body.updates.length} колонок успешно обновлён`,
      boardId,
      updated: body.updates.length
    }
  } catch (error) {
    // ============================================
    // 11. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось изменить порядок колонок'
    })
  }
})
