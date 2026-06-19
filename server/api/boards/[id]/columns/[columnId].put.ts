// server/api/boards/[id]/columns/[columnId].put.ts

/**
 * API Endpoint: Обновление колонки
 *
 * Архитектура:
 * - PUT /api/boards/{boardId}/columns/{columnId}
 * - Валидация данных и прав доступа
 * - Обновление в БД + broadcast через Socket.IO
 * - Логирование на русском языке
 */
import { eventHandler, createError, readBody } from 'h3'
import { db, boards, boardColumns } from '../../../../db'
import { eq, and } from 'drizzle-orm'
import { verifyAuth } from '../../../../utils/auth'
import { getIO } from '../../../../socket/common'
import { broadcastColumnUpdated } from '../../../../socket/handlers/columns'
import type { BoardColumn } from '~/types/boards'

/**
 * Интерфейс тела запроса
 */
interface UpdateColumnBody {
  name?: string
  order?: number
}

/**
 * Интерфейс ответа API
 */
interface UpdateColumnResponse {
  success: boolean
  column: BoardColumn
}

/**
 * Обработчик запроса
 */
export default eventHandler(async (event): Promise<UpdateColumnResponse> => {
  const startTime = Date.now()
  
  try {
    // ============================================
    // 1. ПРОВЕРКА АУТЕНТИФИКАЦИИ
    // ============================================
    const user = await verifyAuth(event)
    console.log(`[API] 📥 Запрос обновления колонки: пользователь ${user.id}`)
    
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
    
    console.log(`[API] 🔍 Обновление колонки ${columnId} на доске ${boardId}`)
    
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
        name: boardColumns.name,
        order: boardColumns.order
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
    // 5. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
    // ============================================
    const body = await readBody<UpdateColumnBody>(event)
    
    // Проверка что есть данные для обновления
    if (Object.keys(body).length === 0) {
      console.warn(`[API] ⚠️ Нет данных для обновления`)
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления'
      })
    }
    
    // ============================================
    // 6. ПОДГОТОВКА ДАННЫХ ДЛЯ ОБНОВЛЕНИЯ
    // ============================================
    const updateData: Record<string, any> = {}
    
    // Обновление названия
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название колонки не может быть пустым'
        })
      }
      if (body.name.trim().length > 255) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название колонки не может превышать 255 символов'
        })
      }
      updateData.name = body.name.trim()
    }
    
    // Обновление порядка
    if (body.order !== undefined) {
      if (typeof body.order !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: 'order должен быть числом'
        })
      }
      updateData.order = body.order
    }
    
    // Если после валидации нет данных для обновления
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления после валидации'
      })
    }
    
    // ============================================
    // 7. ОБНОВЛЕНИЕ КОЛОНКИ В БД
    // ============================================
    updateData.updatedAt = new Date()
    
    await db
      .update(boardColumns)
      .set(updateData)
      .where(eq(boardColumns.id, columnId))
    
    console.log(`[API] ✅ Колонка обновлена в БД`)
    
    // ============================================
    // 8. ПОЛУЧЕНИЕ ОБНОВЛЁННОЙ КОЛОНКИ
    // ============================================
    const [updatedColumn] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, columnId))
    
    if (!updatedColumn) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить обновлённую колонку'
      })
    }
    
    // ============================================
    // 9. КОНВЕРТАЦИЯ ДАТ В ISO-СТРОКИ
    // ============================================
    const columnForResponse: BoardColumn = {
      id: updatedColumn.id,
      boardId: updatedColumn.boardId,
      name: updatedColumn.name,
      order: updatedColumn.order ?? 0,
      createdAt: updatedColumn.createdAt
        ? new Date(updatedColumn.createdAt).toISOString()
        : new Date().toISOString(),
      updatedAt: updatedColumn.updatedAt
        ? new Date(updatedColumn.updatedAt).toISOString()
        : new Date().toISOString()
    }
    
    // ============================================
    // 10. BROADCAST СОБЫТИЯ ЧЕРЕЗ SOCKET.IO
    // ============================================
    const io = getIO()
    if (io) {
      console.log(`[API] 📡 Broadcast обновления колонки ${columnId} на доску ${boardId}`)
      broadcastColumnUpdated(io, columnForResponse, boardId)
    } else {
      console.warn(`[API] ⚠️ Socket.IO instance не доступен`)
    }
    
    // ============================================
    // 11. ВОЗВРАТ ОТВЕТА
    // ============================================
    const executionTime = Date.now() - startTime
    console.log(`[API] ✅ Колонка обновлена за ${executionTime}мс`)
    
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
      statusMessage: 'Не удалось обновить колонку'
    })
  }
})
