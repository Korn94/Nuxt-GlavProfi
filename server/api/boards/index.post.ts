// server/api/boards/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../db'
import { boards, objects } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Читаем тело запроса
    const body = await readBody(event)

    // ============================================
    // ВАЛИДАЦИЯ ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ
    // ============================================
    
    // Название доски
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Название доски обязательно'
      })
    }

    // ✅ folderId - ОБЯЗАТЕЛЬНОЕ ПОЛЕ
    if (body.folderId === undefined || body.folderId === null || isNaN(Number(body.folderId))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'folderId обязателен для создания доски'
      })
    }
    const folderId = Number(body.folderId)

    // ============================================
    // ВАЛИДАЦИЯ ТИПА ДОСКИ
    // ============================================
    
    const validTypes = ['object', 'general']
    const type = body.type || 'general'
    
    if (!validTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Тип доски должен быть одним из: ${validTypes.join(', ')}`
      })
    }

    // ============================================
    // ПРОВЕРКА objectId ДЛЯ ТИПА 'object'
    // ============================================
    
    let objectId: number | null = null
    if (type === 'object') {
      if (!body.objectId || typeof body.objectId !== 'number') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Для типа "object" необходимо указать objectId'
        })
      }
      objectId = body.objectId
    }

    // ============================================
    // СОЗДАНИЕ ДОСКИ
    // ============================================
    
    const [newBoard] = await db
      .insert(boards)
      .values({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        type: type,
        objectId: objectId,
        folderId: folderId, // ✅ КРИТИЧЕСКИ ВАЖНО
        order: body.order !== undefined ? Number(body.order) : 0,
        createdBy: user.id
      })
      .$returningId()

    // Проверка результата вставки
    if (!newBoard || !newBoard.id) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось создать доску'
      })
    }

    // ============================================
    // ПОЛУЧЕНИЕ ПОЛНЫХ ДАННЫХ ДОСКИ
    // ============================================
    
    const [board] = await db
      .select({
        id: boards.id,
        name: boards.name,
        description: boards.description,
        type: boards.type,
        objectId: boards.objectId,
        folderId: boards.folderId,
        order: boards.order,
        createdBy: boards.createdBy,
        createdAt: boards.createdAt,
        updatedAt: boards.updatedAt
      })
      .from(boards)
      .where(eq(boards.id, newBoard.id))

    if (!board) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Не удалось получить данные созданной доски'
      })
    }

    // ============================================
    // ПОЛУЧЕНИЕ ДАННЫХ ОБЪЕКТА (ЕСЛИ ТИП 'object')
    // ============================================
    
    let object = null
    if (board.type === 'object' && board.objectId) {
      const [obj] = await db
        .select({
          id: objects.id,
          name: objects.name,
          status: objects.status,
          address: objects.address
        })
        .from(objects)
        .where(eq(objects.id, board.objectId))
      
      object = obj
    }

    // ============================================
    // ВОЗВРАТ ОТВЕТА С ПОЛЕМ object
    // ============================================
    
    return {
      success: true,
      board: {
        ...board,
        object // ✅ Возвращаем данные объекта для досок типа 'object'
      }
    }
  } catch (error) {
    console.error('Error creating board:', error)
    
    // Если это уже созданный error из h3, пробрасываем его
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create board'
    })
  }
})
