// server/api/auth/telegram.post.ts
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from '../../utils/jwt'
import { eventHandler, readBody, createError, getRequestHeader, getRequestIP } from 'h3'
import { verifyTelegramHash } from '../../utils/verifyTelegramHash'
import { getObjectsByUser } from '../../utils/objects'
import { createSession } from '../../utils/sessions'

export default eventHandler(async (event) => {
  const body = await readBody(event)
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Telegram bot token not configured' 
    })
  }
  
  // Проверяем подлинность данных из Telegram
  if (!verifyTelegramHash(body, botToken)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid Telegram data' })
  }

  // Ищем пользователя по telegramId
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, parseInt(body.id)))

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'User not found' })
  }

  // Получаем информацию о запросе для сессии
  const ipAddress = getRequestIP(event, { xForwardedFor: true })
  const userAgent = getRequestHeader(event, 'user-agent') || undefined

  const objects = await getObjectsByUser(user.id)
  
  const token = await generateToken({ 
    id: user.id, 
    login: user.login,
    role: user.role,
    objects: objects.map(o => ({ id: o.id }))
  })

  // Создаем сессию пользователя
  const session = await createSession(user.id, ipAddress, userAgent)

  // Возвращаем и токен, и данные пользователя
  return { 
    token,
    user: {
      id: user.id,
      email: user.login,
      name: user.name || body.first_name || 'Пользователь',
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: true
    },
    sessionId: session?.sessionId // Возвращаем ID сессии
  }
})
