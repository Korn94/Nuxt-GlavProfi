// server/api/boards/[id]/index.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db, boards } from '../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID доски'
      })
    }

    const boardId = Number(id)

    // Проверяем, существует ли доска
    const [existingBoard] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))

    if (!existingBoard) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Доска не найдена'
      })
    }

    // Читаем тело запроса
    const body = await readBody(event)

    // Подготавливаем данные для обновления
    const updateData: any = {}

    // Обновляем название, если передано
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Название доски не может быть пустым'
        })
      }
      updateData.name = body.name.trim()
    }

    // Обновляем описание, если передано
    if (body.description !== undefined) {
      updateData.description = body.description
    }

    // Обновляем тип, если передано
    if (body.type !== undefined) {
      const validTypes = ['object', 'general']
      if (!validTypes.includes(body.type)) {
        throw createError({
          statusCode: 400,
          statusMessage: `Тип доски должен быть одним из: ${validTypes.join(', ')}`
        })
      }
      updateData.type = body.type
    }

    // Обновляем objectId, если передано
    if (body.objectId !== undefined) {
      if (body.objectId === null) {
        updateData.objectId = null
      } else if (typeof body.objectId === 'number') {
        updateData.objectId = body.objectId
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'objectId должен быть числом или null'
        })
      }
    }

    // Если нет данных для обновления
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Нет данных для обновления'
      })
    }

    // Обновляем доску
    await db
      .update(boards)
      .set(updateData)
      .where(eq(boards.id, boardId))

    // Получаем обновлённую доску
    const [updatedBoard] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, boardId))

    return {
      success: true,
      board: updatedBoard
    }
  } catch (error) {
    console.error('Error updating board:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update board'
    })
  }
})
