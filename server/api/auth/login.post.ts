/**
 * 📍 Эндпоинт: POST /api/auth/login
 *
 * Назначение:
 * - Аутентификация пользователя по логину и паролю
 * - Генерация JWT-токена и создание серверной сессии
 * - Возврат данных пользователя + прав для инициализации клиента
 *
 * ⚠️ Публичный эндпоинт (в PUBLIC_PATHS мидлвара).
 * Он НЕ требует авторизации — он её СОЗДАЁТ.
 *
 * @body { login: string, password: string }
 * @returns { token, user, sessionId, permissions }
 *
 * Улучшения относительно старой версии:
 * - ✅ permissions в одном ответе (нет race condition на клиенте)
 * - ✅ zod-валидация входящего тела
 * - ✅ типобезопасный User через schema inference
 */

import { eventHandler, readBody, createError, getRequestHeader, getRequestIP } from 'h3'
import { z } from 'zod'

import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'

import { generateToken } from '../../utils/jwt'
import { getObjectsByUser } from '../../utils/objects'
import { createSession, closeZombieSessions } from '../../utils/sessions'
import { getUserPermissionsResponse } from '../../utils/permissions'

import bcryptjs from 'bcryptjs'

// ============================================
// 1. ZOD-ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
// ============================================

const LoginBodySchema = z.object({
  login: z.string().min(1, 'Логин обязателен').max(100),
  password: z.string().min(1, 'Пароль обязателен').max(255)
})

// ============================================
// 2. ОБРАБОТЧИК
// ============================================

export default eventHandler(async (event) => {
  // ============================================
  // ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА
  // ============================================
  const rawBody = await readBody(event)

  const parseResult = LoginBodySchema.safeParse(rawBody)
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map(i => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw createError({
      statusCode: 400,
      statusMessage: `Ошибка валидации: ${issues}`
    })
  }

  const body = parseResult.data

  // Метаданные запроса для сессии
  const ipAddress = getRequestIP(event, { xForwardedFor: true })
  const userAgent = getRequestHeader(event, 'user-agent') || undefined

  // ============================================
  // ПОИСК ПОЛЬЗОВАТЕЛЯ В БД
  // ============================================
  const [user] = await db.select().from(users).where(eq(users.login, body.login))

  if (!user) {
    // Не раскрываем что именно не так (логин или пароль) — защита от перебора
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверные учётные данные'
    })
  }

  // ============================================
  // ПРОВЕРКА ПАРОЛЯ
  // ============================================
  const isPasswordValid = await bcryptjs.compare(body.password, user.password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверные учётные данные'
    })
  }

  // ============================================
  // ПОДГОТОВКА JWT-ТОКЕНА
  // ============================================
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
  // Убираем race condition: клиент получает permissions сразу,
  // не делая отдельный запрос к /api/permissions
  const permissions = await getUserPermissionsResponse(user)

  // ============================================
  // ФОРМИРОВАНИЕ ОТВЕТА
  // ============================================
  return {
    token,
    user: {
      id: user.id,
      login: user.login,
      name: user.name || user.login,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: true
    },
    sessionId: session?.sessionId,
    permissions // ← НОВОЕ: права сразу в ответе
  }
})
