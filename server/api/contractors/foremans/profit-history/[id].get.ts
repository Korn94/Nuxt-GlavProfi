// server/api/contractors/foreman/profit-history/[id].get.ts 
import { defineEventHandler, getRouterParam, createError } from 'h3'
import { db } from '../../../../db'
import { foremanProfitHistory, objects } from '../../../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({ 
      statusCode: 400, 
      message: 'ID прораба обязателен' 
    })
  }

  try {
    // Получаем историю начислений для прораба
    const history = await db
      .select({
        id: foremanProfitHistory.id,
        workId: foremanProfitHistory.workId,
        objectId: foremanProfitHistory.objectId,
        objectName: objects.name,
        amount: foremanProfitHistory.amount,
        createdAt: foremanProfitHistory.createdAt
      })
      .from(foremanProfitHistory)
      .leftJoin(objects, eq(foremanProfitHistory.objectId, objects.id))
      .where(eq(foremanProfitHistory.foremanId, parseInt(id)))
      .orderBy(foremanProfitHistory.createdAt)

    // Форматируем ответ
    const formattedHistory = history.map(entry => ({
      workId: entry.workId,
      objectId: entry.objectId,
      objectName: entry.objectName || 'Неизвестный объект',
      amount: Number(entry.amount).toFixed(2),
      date: entry.createdAt 
        ? new Date(entry.createdAt).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }) 
        : '—'
    }))

    return {
      foremanId: parseInt(id),
      profitHistory: formattedHistory
    }
  } catch (error) {
    console.error('Ошибка получения истории начислений:', error)
    throw createError({ 
      statusCode: 500, 
      message: 'Ошибка сервера при получении истории начислений' 
    })
  }
})
