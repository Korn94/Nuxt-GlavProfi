// server/api/send-message/index.post.ts
import { defineEventHandler, readBody, readMultipartFormData, createError } from 'h3'
import nodemailer from 'nodemailer'
import TelegramBot from 'node-telegram-bot-api'

interface ParsedFields {
  message?: string
  name?: string
  phone?: string
  comment?: string
  source?: string
}

interface ParsedFile {
  name: string
  filename: string
  data: Buffer
  type: string
}

export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') return null
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  try {
    const contentType = event.headers.get('content-type') || ''
    const isMultipart = contentType.includes('multipart/form-data')

    let fields: ParsedFields = {}
    let files: ParsedFile[] = []

    // === Парсинг тела запроса ===
    if (isMultipart) {
      // FormData (с файлами или без)
      const parts = (await readMultipartFormData(event)) || []

      for (const part of parts) {
        const key = part.name
        if (!key) continue

        if (part.filename) {
          // ✅ Это файл — добавляем в массив (поддержка и 'file', и 'files')
          files.push({
            name: key,
            filename: part.filename,
            data: Buffer.from(part.data),
            type: part.type || 'application/octet-stream',
          })
        } else {
          // Это обычное текстовое поле
          ;(fields as any)[key] = part.data.toString('utf-8')
        }
      }
    } else {
      // JSON (обратная совместимость)
      const body = await readBody(event)
      fields = body || {}
    }

    const { message, name, phone, comment } = fields

    if (!message) {
      throw createError({ statusCode: 400, statusMessage: 'Message is required' })
    }

    const config = useRuntimeConfig()

    // --- 1. Telegram ---
    const sendTelegram = async () => {
      const botToken = config.telegramBotToken
      const chatId = config.telegramChatId

      if (!botToken || !chatId) return false

      try {
        const bot = new TelegramBot(botToken, {
          polling: false,
          request: { timeout: 10000 } as any,
        })

        // ✅ Сначала отправляем текстовое сообщение с деталями заявки
        await bot.sendMessage(chatId, message, {
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        })

        // ✅ Затем все файлы отдельными сообщениями (документами)
        for (const f of files) {
          await bot.sendDocument(
            chatId,
            f.data,
            {},
            {
              filename: f.filename,
              contentType: f.type,
            }
          )
        }

        console.log(
          '✅ Telegram: OK',
          files.length > 0 ? `(с ${files.length} файл(ами))` : ''
        )
        return true
      } catch (e: any) {
        console.warn('⚠️ Telegram failed (non-critical):', e.message)
        return false
      }
    }

    // --- 2. Email ---
    const sendEmail = async () => {
      const emailConfig = config.email
      if (!emailConfig.host || !emailConfig.user || !emailConfig.to) {
        console.warn('⚠️ Email not configured')
        return false
      }

      const transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: { user: emailConfig.user, pass: emailConfig.pass },
      })

      // ✅ Все файлы во вложении
      const attachments = files.map((f) => ({
        filename: f.filename,
        content: f.data,
        contentType: f.type,
      }))

      // Формируем блок файлов для HTML-письма
      const filesHtmlRow = files.length > 0
        ? `<tr>
            <td style="padding:8px;background:#f9f9f9;font-weight:bold;vertical-align:top">
              Файлы (${files.length}):
            </td>
            <td style="padding:8px">
              ${files.map((f) => `📎 ${f.filename}`).join('<br/>')}
            </td>
          </tr>`
        : ''

      await transporter.sendMail({
        from: emailConfig.from,
        to: emailConfig.to,
        subject: `🔥 Новая заявка: ${name || 'Аноним'}`,
        text: message,
        html: `
          <div style="font-family:sans-serif;max-width:600px">
            <h2 style="color:#00c3f5">Заявка с сайта ГлавПрофи</h2>
            <table style="width:100%;border-collapse:collapse;margin-top:20px">
              <tr>
                <td style="padding:8px;background:#f9f9f9;font-weight:bold">Имя:</td>
                <td style="padding:8px">${name || '-'}</td>
              </tr>
              <tr>
                <td style="padding:8px;background:#f9f9f9;font-weight:bold">Телефон:</td>
                <td style="padding:8px">
                  <a href="tel:${phone?.replace(/\D/g, '') || ''}">${phone || '-'}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:8px;background:#f9f9f9;font-weight:bold;vertical-align:top">
                  Комментарий:
                </td>
                <td style="padding:8px;white-space:pre-line;font-family:monospace;font-size:13px;line-height:1.5">
                  ${comment || '-'}
                </td>
              </tr>
              ${filesHtmlRow}
            </table>
          </div>`,
        attachments,
      })

      console.log(
        '✅ Email: OK',
        files.length > 0 ? `(с ${files.length} файл(ами))` : ''
      )
      return true
    }

    // Запускаем параллельно
    const [telegramOk, emailOk] = await Promise.all([sendTelegram(), sendEmail()])

    return {
      success: emailOk,
      channels: {
        email: emailOk ? 'sent' : 'failed',
        telegram: telegramOk ? 'sent' : 'blocked',
      },
      filesAttached: files.length,
    }
  } catch (error: any) {
    console.error('Critical error:', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
