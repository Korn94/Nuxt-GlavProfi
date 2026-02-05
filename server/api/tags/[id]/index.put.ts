// server/api/tags/[id]/index.put.ts
import { eventHandler, createError, readBody } from 'h3'
import { db, boardsTags } from '../../../db'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Проверяем аутентификацию
    const user = await verifyAuth(event)

    // Получаем ID тега из параметров
    const id = event.context.params?.id

    if (!id || isNaN(Number(id))) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Некорректный ID тега'
      })
    }

    const tagId = Number(id)

    // Проверяем, существует ли тег
    const [existingTag] = await db
      .select()
      .from(boardsTags)
      .where(eq(boardsTags.id, tagId))

    if (!existingTag) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Тег не найден'
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
          statusMessage: 'Название тега не может быть пустым'
        })
      }

      // Проверяем, что тег с таким названием ещё не существует (кроме текущего)
      const [duplicateTag] = await db
        .select()
        .from(boardsTags)
        .where(eq(boardsTags.name, body.name.trim()))

      if (duplicateTag && duplicateTag.id !== tagId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Тег с таким названием уже существует'
        })
      }

      updateData.name = body.name.trim()
    }

    // Обновляем цвет, если передано
    if (body.color !== undefined) {
      if (typeof body.color === 'string' && /^#[0-9A-F]{6}$/i.test(body.color)) {
        updateData.color = body.color
      } else {
        throw createError({
          statusCode: 400,
          statusMessage: 'Цвет должен быть в формате HEX (#RRGGBB)'
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

    // Обновляем тег
    await db
      .update(boardsTags)
      .set(updateData)
      .where(eq(boardsTags.id, tagId))

    // Получаем обновлённый тег
    const [updatedTag] = await db
      .select()
      .from(boardsTags)
      .where(eq(boardsTags.id, tagId))

    return {
      success: true,
      tag: updatedTag
    }
  } catch (error) {
    console.error('Error updating tag:', error)
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update tag'
    })
  }
})
