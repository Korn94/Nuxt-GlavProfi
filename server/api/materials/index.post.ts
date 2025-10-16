// server/api/materials/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../db'
import { materials } from '../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    if (!body.name || !body.amount || !body.type || !body.objectId) {
      throw createError({ 
        statusCode: 400,
        message: 'Недостающие обязательные поля' 
      })
    }

    // Проверяем и парсим дату
    let operationDate = new Date()
    if (body.operationDate) {
      const parsedDate = new Date(body.operationDate)
      if (isNaN(parsedDate.getTime())) {
        throw createError({ 
          statusCode: 400, 
          message: 'Некорректный формат даты операции' 
        })
      }
      operationDate = parsedDate
    }

    // Вставляем материал с датой
    await db.insert(materials).values({
      name: body.name,
      amount: body.amount,
      comment: body.comment || '',
      hasReceipt: body.hasReceipt || false,
      type: body.type,
      objectId: parseInt(body.objectId),
      operationDate: operationDate
    })

    const [newMaterial] = await db.select()
      .from(materials)
      .orderBy(materials.id)
      .limit(1)

    return newMaterial
  } catch (error) {
    console.error('Ошибка создания материала:', error)
    throw createError({ 
      statusCode: 500,
      message: 'Ошибка сервера при создании материала' 
    })
  }
})
