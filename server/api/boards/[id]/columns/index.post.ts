// server/api/boards/[id]/columns/index.post.ts

/**
 * API Endpoint: Создание колонки
 *
 * Архитектура:
 * - POST /api/boards/{boardId}/columns
 * - Валидация данных и прав доступа
 * - Создание в БД + broadcast через Socket.IO
 * - Логирование на русском языке
 */
import { eventHandler, createError, readBody } from 'h3'
import { db, boards, boardColumns } from '../../../../db'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/permissions'
import { getIO } from '../../../../socket/common'
import { broadcastColumnCreated } from '../../../../socket/handlers/columns'
import type { BoardColumn } from '~/types/boards'

/**
 * Интерфейс тела запроса
 */
interface CreateColumnBody {
  name: string
  order?: number
}

/**
 * Интерфейс ответа API
 */
interface CreateColumnResponse {
  success: boolean
  column: BoardColumn
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<CreateColumnResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await requireAuth(event)
    console.log(`[API] 📥 Запрос создания колонки: пользователь ${user.id}`)
    
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
    console.log(`[API] 🔍 Создание колонки для доски ${boardId}`)
    
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
    const body = await readBody<CreateColumnBody>(event)
    
    // Проверка названия
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      console.warn(`[API] ⚠️ Пустое название колонки`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Название колонки обязательно'
      })
    }
    
    if (body.name.trim().length > 255) {
      console.warn(`[API] ⚠️ Название колонки слишком длинное (${body.name.trim().length} символов)`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Название колонки не может превышать 255 символов'
      })
    }
    
    // ============================================
    // 5. ПОЛУЧЕНИЕ СЛЕДУЮЩЕГО ПОРЯДКОВОГО НОМЕРА
    // ============================================
    const order = body.order ?? 0
    let finalOrder = order
    
    if (order === 0 || order === undefined) {
      // Получаем максимальный order для этой доски
      const [maxOrderColumn] = await db
        .select({
          order: boardColumns.order
        })
        .from(boardColumns)
        .where(eq(boardColumns.boardId, boardId))
        .orderBy(desc(boardColumns.order))
        .limit(1)
      
      finalOrder = (maxOrderColumn?.order ?? -1) + 1
    }
    
    console.log(`[API] 📊 Порядок колонки: ${finalOrder}`)
    
    // ============================================
    // 6. ПОДГОТОВКА ДАННЫХ ДЛЯ ВСТАВКИ
    // ============================================
    const columnData = {
      boardId,
      name: body.name.trim(),
      order: finalOrder
    }
    
    // ============================================
    // 7. СОЗДАНИЕ КОЛОНКИ В БД
    // ============================================
    const [newColumn] = await db
      .insert(boardColumns)
      .values(columnData)
      .$returningId()
    
    if (!newColumn?.id) {
      console.error(`[API] ❌ Не удалось создать колонку: нет ID`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать колонку'
      })
    }
    
    console.log(`[API] ✅ Колонка создана в БД: ${newColumn.id}`)
    
    // ============================================
    // 8. ПОЛУЧЕНИЕ ПОЛНЫХ ДАННЫХ КОЛОНКИ
    // ============================================
    const [createdColumn] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, newColumn.id))
    
    if (!createdColumn) {
      console.error(`[API] ❌ Не удалось получить созданную колонку`)
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить созданную колонку'
      })
    }
    
    // ============================================
    // 9. КОНВЕРТАЦИЯ ДАТ В ISO-СТРОКИ
    // ============================================
    const columnForResponse: BoardColumn = {
      id: createdColumn.id,
      boardId: createdColumn.boardId,
      name: createdColumn.name,
      order: createdColumn.order ?? 0,
      createdAt: createdColumn.createdAt
        ? new Date(createdColumn.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: createdColumn.updatedAt
        ? new Date(createdColumn.updatedAt).toISOString()
        : new Date().toISOString()
    }
    
    // ============================================
    // 10. BROADCAST СОБЫТИЯ ЧЕРЕЗ SOCKET.IO
    // ============================================
    const io = getIO()
    if (io) {
      console.log(`[API] 📡 Broadcast создания колонки ${createdColumn.id} на доску ${boardId}`)
      broadcastColumnCreated(io, columnForResponse, boardId)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }
    
    // ============================================
    // 11. ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Колонка создана за ${executionTime}мс`)
    
    return {
      success: true,
      column: columnForResponse
    }
  } catch (error) {
    // ============================================
    // 12. ОБРАБОТКА ОШИБОК
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
      statusMessage: 'Не удалось создать колонку'
    })
  }
})
