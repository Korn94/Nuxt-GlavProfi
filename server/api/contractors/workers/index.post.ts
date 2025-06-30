// server/api/contractors/workers/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { db } from '../../../db'
import { workers } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)

    // Проверка обязательных полей
    if (!body.name || !body.phone) {
      throw createError({ 
        statusCode: 400, 
        message: 'Имя и телефон обязательны' 
      })
    }

    // Проверяем, есть ли objectId — если нужно, можно добавить nullable
    const workerData = {
      name: body.name,
      phone: body.phone,
      comment: body.comment || '',
      balance: body.balance || 0,
      isNoName: body.isNoName || false,
      worksCompleted: body.worksCompleted || 0,
      works: Array.isArray(body.works) ? body.works.join(', ') : body.works || '',
      userId: body.userId || null
    }

    // Вставляем данные
    await db.insert(workers).values(workerData)

    // Получаем созданного рабочего
    const [newWorker] = await db.select().from(workers).orderBy(workers.id).limit(1)

    return newWorker
  } catch (error) {
    console.error('Ошибка создания рабочего:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Ошибка сервера при создании рабочего' 
    })
  }
})
