// server/api/send-message/index.ts
import { defineEventHandler, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  // Обработка CORS preflight запросов
  if (event.method === 'OPTIONS') {
    return null
  }

  if (event.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    const { message } = body

    if (!message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message is required'
      })
    }

    // Получаем токен и chatId из runtime config (через useRuntimeConfig)
    const config = useRuntimeConfig()
    const botToken = config.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN
    const chatId = config.telegramChatId || process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      console.error('Telegram credentials not configured')
      throw createError({
        statusCode: 500,
        statusMessage: 'Telegram configuration error'
      })
    }

    // Формируем URL для отправки сообщения
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`

    // Отправляем запрос к Telegram API с увеличенным таймаутом
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 секунд

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML'
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const result = await response.json()

      if (!result.ok) {
        console.error('Telegram API error:', result.description)
        throw createError({
          statusCode: response.status,
          statusMessage: result.description || 'Failed to send message to Telegram'
        })
      }

      return {
        success: true,
        message: 'Message sent successfully'
      }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)

      if (fetchError.name === 'AbortError') {
        console.error('Telegram API request timed out')
        throw createError({
          statusCode: 504,
          statusMessage: 'Gateway Timeout: Telegram API did not respond'
        })
      }

      throw fetchError
    }
  } catch (error: any) {
    console.error('Error sending message:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})