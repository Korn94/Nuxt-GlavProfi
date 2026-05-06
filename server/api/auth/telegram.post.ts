/**
 * 📍 Эндпоинт: POST /api/auth/telegram
 * 
 * Назначение:
 * - Аутентификация пользователя через Telegram Login Widget
 * - Проверка хеша данных через verifyTelegramHash()
 * - Генерация JWT-токена и создание серверной сессии
 * - Возврат данных пользователя для инициализации клиента
 * 
 * ⚠️ ВАЖНО: Это публичный эндпоинт (в PUBLIC_PATHS мидлвара).
 * Он НЕ требует авторизации — он её СОЗДАЁТ.
 * 
 * @body { id: string, first_name: string, hash: string, ... } — данные от Telegram
 * @returns { token: string, user: UserData, sessionId: string }
 * 
 * Примеры ответов:
 * ✅ Успех: { token: "eyJ...", user: { id: 1, ... }, sessionId: "sess_..." }
 * ❌ Ошибка: 401 { statusMessage: "Неверные данные Telegram" }
 */

import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from '../../utils/jwt'
import { eventHandler, readBody, createError, getRequestHeader, getRequestIP } from 'h3'
import { verifyTelegramHash } from '../../utils/verifyTelegramHash'
import { getObjectsByUser } from '../../utils/objects'
import { createSession, closeZombieSessions } from '../../utils/sessions'

export default eventHandler(async (event) => {
  // ============================================
  // 1. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody(event)
  
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  
  if (!botToken) {
    console.error('[Auth/Telegram] ❌ TELEGRAM_BOT_TOKEN не настроен')
    throw createError({ 
      statusCode: 500, 
      statusMessage: 'Сервер не настроен для Telegram-авторизации' 
    })
  }
  
  // ============================================
  // 2. ПРОВЕРКА ПОДЛИННОСТИ ДАННЫХ ОТ TELEGRAM
  // ============================================
  if (!verifyTelegramHash(body, botToken)) {
    console.log(`[Auth/Telegram] ⚠️ Неверный хеш от Telegram (user_id: ${body?.id})`)
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Неверные данные Telegram' 
    })
  }

  // ============================================
  // 3. ПОИСК ПОЛЬЗОВАТЕЛЯ ПО telegramId
  // ============================================
  const telegramId = parseInt(body?.id, 10)
  
  if (isNaN(telegramId)) {
    console.log('[Auth/Telegram] ⚠️ Неверный формат telegramId')
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Неверный идентификатор пользователя' 
    })
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))

  if (!user) {
    console.log(`[Auth/Telegram] ⚠️ Пользователь с telegramId ${telegramId} не найден`)
    throw createError({ 
      statusCode: 404, 
      statusMessage: 'Пользователь не найден. Свяжитесь с администратором.' 
    })
  }

  // ============================================
  // 4. ПОДГОТОВКА ДАННЫХ ДЛЯ ТОКЕНА
  // ============================================
  const ipAddress = getRequestIP(event, { xForwardedFor: true })
  const userAgent = getRequestHeader(event, 'user-agent') || undefined

  const objects = await getObjectsByUser(user.id)
  
  const tokenPayload = { 
    id: user.id, 
    login: user.login,
    role: user.role,
    objects: objects.map(o => ({ id: o.id }))
  }
  
  const token = await generateToken(tokenPayload)

  // ============================================
  // 5. СОЗДАНИЕ СЕССИИ
  // ============================================
  // ✅ Закрываем старые "зомби"-сессии перед созданием новой
  await closeZombieSessions(user.id)
  
  const session = await createSession(user.id, ipAddress, userAgent)

  // ============================================
  // 6. ФОРМИРОВАНИЕ ОТВЕТА
  // ============================================
  console.log(`[Auth/Telegram] ✅ Успешный вход через Telegram: ${user.login} (ID: ${user.id})`)
  
  return { 
    token,
    user: {
      id: user.id,
      login: user.login,      // ✅ Поле login, а не email (соответствует клиенту)
      name: user.name || body.first_name || 'Пользователь',
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: true
    },
    sessionId: session?.sessionId // Возвращаем ID сессии для сокета
  }
})
