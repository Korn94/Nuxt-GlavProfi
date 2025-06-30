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

    // Вставляем материал
    await db.insert(materials).values({
      name: body.name,
      amount: body.amount,
      comment: body.comment || '',
      hasReceipt: body.hasReceipt || false,
      type: body.type,
      objectId: parseInt(body.objectId),
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
