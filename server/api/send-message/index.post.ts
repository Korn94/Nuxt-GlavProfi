// server/api/send-message/index.post.ts

import { defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = config.public.telegramBotToken
  const chatId = config.public.telegramChatId

  const body = await readBody(event)

  // Отправка сообщения через Telegram API
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const payload = {
    chat_id: chatId,
    text: body.message
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  return await response.json()
})
