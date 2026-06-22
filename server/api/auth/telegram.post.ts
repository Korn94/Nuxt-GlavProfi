/**
 * 📍 Эндпоинт: POST /api/auth/telegram
 *
 * Назначение:
 * - Аутентификация через Telegram Login Widget
 * - Проверка хеша через verifyTelegramHash()
 * - Генерация JWT и создание серверной сессии
 * - Возврат user + permissions в одном ответе
 *
 * ⚠️ Публичный эндпоинт (в PUBLIC_PATHS мидлвара).
 *
 * @body Telegram InitData (id, first_name, hash, ...)
 * @returns { token, user, sessionId, permissions }
 */

import { eventHandler, readBody, createError, getRequestHeader, getRequestIP } from 'h3'
import { z } from 'zod'

import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'

import { generateToken } from '../../utils/jwt'
import { verifyTelegramHash } from '../../utils/verifyTelegramHash'
import { getObjectsByUser } from '../../utils/objects'
import { createSession, closeZombieSessions } from '../../utils/sessions'
import { getUserPermissionsResponse } from '../../utils/permissions'

// ============================================
// 1. ZOD-ВАЛИДАЦИЯ ДАННЫХ TELEGRAM
// ============================================

const TelegramBodySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(v => parseInt(String(v), 10)),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().url().optional(),
  auth_date: z.union([z.string(), z.number()]).optional(),
  hash: z.string().min(1, 'Hash обязателен')
}).passthrough() // Telegram может присылать дополнительные поля

// ============================================
// 2. ОБРАБОТЧИК
// ============================================

export default eventHandler(async (event) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.error('[Auth/Telegram] ❌ TELEGRAM_BOT_TOKEN не настроен')
    throw createError({
      statusCode: 500,
      statusMessage: 'Сервер не настроен для Telegram-авторизации'
    })
  }

  // ============================================
  // ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА
  // ============================================
  const rawBody = await readBody(event)

  const parseResult = TelegramBodySchema.safeParse(rawBody)
  if (!parseResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Неверный формат данных Telegram'
    })
  }

  const body = parseResult.data

  // ============================================
  // ПРОВЕРКА ПОДЛИННОСТИ ДАННЫХ TELEGRAM
  // ============================================
  if (!verifyTelegramHash(rawBody, botToken)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверные данные Telegram'
    })
  }

  // ============================================
  // ВАЛИДАЦИЯ telegramId
  // ============================================
  const telegramId = body.id
  if (isNaN(telegramId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Неверный идентификатор пользователя'
    })
  }

  // ============================================
  // ПОИСК ПОЛЬЗОВАТЕЛЯ
  // ============================================
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, telegramId))

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Пользователь не найден. Свяжитесь с администратором.'
    })
  }

  // ============================================
  // ПОДГОТОВКА JWT-ТОКЕНА
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
  // СОЗДАНИЕ СЕССИИ
  // ============================================
  await closeZombieSessions(user.id)
  const session = await createSession(user.id, ipAddress, userAgent)

  // ============================================
  // 🆕 ПОЛУЧЕНИЕ ПРАВ (в одном ответе с логином)
  // ============================================
  const permissions = await getUserPermissionsResponse(user)

  // ============================================
  // ФОРМИРОВАНИЕ ОТВЕТА
  // ============================================
  return {
    token,
    user: {
      id: user.id,
      login: user.login,
      name: user.name || body.first_name || 'Пользователь',
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: true
    },
    sessionId: session?.sessionId,
    permissions // ← НОВОЕ: права сразу в ответе
  }
})
