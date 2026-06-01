// server/utils/defineApi.ts
import { defineEventHandler, createError, H3Event, H3Error } from 'h3'

/**
 * Обертка для API-роутов с автоматической обработкой ошибок.
 * Все логи выводятся на русском языке.
 */
export const defineApi = (handler: (event: H3Event) => Promise<any>) => {
  return defineEventHandler(async (event: H3Event) => {
    try {
      return await handler(event)
    } catch (error: any) {
      // Логируем ошибку на русском с указанием пути запроса
      const message = error?.message || 'Неизвестная ошибка'
      console.error(`❌ Ошибка API [${event.method} ${event.path}]:`, message)

      // Если это уже ошибка H3 — пробрасываем как есть
      if (error instanceof H3Error) {
        throw error
      }

      // Иначе формируем свою ошибку
      throw createError({
        statusCode: error?.statusCode || 500,
        statusMessage: error?.statusMessage || 'Внутренняя ошибка сервера',
        data: error?.data
      })
    }
  })
}
