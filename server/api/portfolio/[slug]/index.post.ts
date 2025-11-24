// server/api/portfolio/[slug]/index.post.ts
import { eventHandler, createError, readBody } from 'h3'
import { db } from '../../../db'
import { portfolioCases } from '../../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyAuth } from '../../../utils/auth'

export default eventHandler(async (event) => {
  try {
    // Авторизация
    const user = await verifyAuth(event)
    if (!['admin', 'manager'].includes(user.role)) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }

    // Проверка params и slug
    const params = event.context.params
    if (!params || !params.slug) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Missing case slug in request parameters' 
      })
    }
    
    const slug = params.slug

    // Чтение тела запроса
    const body = await readBody(event)
    if (!body) {
      throw createError({ 
        statusCode: 400, 
        statusMessage: 'Request body is missing' 
      })
    }

    // Валидация обязательных текстовых полей
    const requiredFields = [
      'title', 'category', 'address',
      'objectDescription', 'shortObject',
      'space', 'duration', 'people',
      'shortDescription'
    ]

    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        throw createError({ 
          statusCode: 400, 
          statusMessage: `Missing required field: ${field}` 
        })
      }
    }

    // Преобразование числовых значений
    const spaceValue = body.space ? String(parseFloat(body.space)) : '0'

    // Подготовка данных для обновления
    const updateData = {
      ...body,
      updatedAt: new Date(),
      space: spaceValue,
      isPublished: body.isPublished === 'true' || body.isPublished === true
    }

    // Удаляем поля, которые не должны быть в таблице portfolioCases
    delete updateData.mainImage
    delete updateData.thumbnail
    delete updateData.beforeAfterPairs
    delete updateData.gallery
    delete updateData.works

    // Обновляем кейс
    await db
      .update(portfolioCases)
      .set(updateData)
      .where(eq(portfolioCases.slug, slug))

    // Теперь выбираем обновлённый кейс
    const [updatedCase] = await db
      .select()
      .from(portfolioCases)
      .where(eq(portfolioCases.slug, slug))

    if (!updatedCase) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: 'Case not found' 
      })
    }

    return updatedCase
  } catch (error) {
    console.error('Ошибка при обновлении кейса:', error)
    
    // Проверяем, является ли ошибка уже созданным объектом ошибки
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    // Иначе создаем общую ошибку сервера
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Internal server error' 
    })
  }
})
