// server/api/send-message/index.ts
import { defineEventHandler, readBody, createError } from 'h3'
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') return null
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  try {
    const body = await readBody(event)
    const { message, name, phone, comment } = body // Деструктурируем данные для письма

    if (!message) {
      throw createError({ statusCode: 400, statusMessage: 'Message is required' })
    }

    const config = useRuntimeConfig()
    
    // --- 1. Отправка в Telegram (как было) ---
    const sendTelegram = async () => {
      const botToken = config.telegramBotToken
      const chatId = config.telegramChatId
      
      if (!botToken || !chatId) return // Если не настроено, просто пропускаем
      
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 сек таймаут

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        const result = await response.json()
        if (!result.ok) console.error('Telegram error:', result.description)
      } catch (e: any) {
        clearTimeout(timeoutId)
        console.error('Telegram fetch error:', e.message)
        // Не выбрасываем ошибку, чтобы не блокировать отправку на почту
      }
    }

    // --- 2. Отправка на почту (Новое) ---
    const sendEmail = async () => {
      const emailConfig = config.email
      
      // Если почта не настроена, выходим
      if (!emailConfig.host || !emailConfig.user || !emailConfig.to) return

      // Создаем транспорт (можно вынести в утилиту, если отправляете часто)
      const transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      })

      // Формируем красивое тело письма
      const mailOptions = {
        from: emailConfig.from,
        to: emailConfig.to,
        subject: `🔥 Новая заявка с сайта: ${name || 'Аноним'}`,
        text: message, // Текстовая версия
        html: `
          <div style="font-family: sans-serif; max-width: 600px;">
            <h2 style="color: #00c3f5;">Новая заявка с сайта ГлавПрофи</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Имя:</td>
                <td style="padding: 8px;">${name || 'Не указано'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; background: #f9f9f9; font-weight: bold;">Телефон:</td>
                <td style="padding: 8px;">
                  <a href="tel:${phone?.replace(/\D/g,'')}">${phone || 'Не указан'}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; background: #f9f9f9; font-weight: bold; vertical-align: top;">Комментарий:</td>
                <td style="padding: 8px;">${comment || 'Без комментария'}</td>
              </tr>
            </table>
            <hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #888;">Заявка отправлена автоматически.</p>
          </div>
        `,
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log('✅ Email sent successfully')
      } catch (error: any) {
        console.error('❌ Email sending error:', error.message)
        // Не выбрасываем ошибку, чтобы не ломать ответ клиенту, если ТГ работает
      }
    }

    // Запускаем обе отправки параллельно
    await Promise.all([
      sendTelegram(),
      sendEmail()
    ])

    return { success: true, message: 'Заявка отправлена' }

  } catch (error: any) {
    console.error('Critical error in send-message:', error)
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error'
    })
  }
})
