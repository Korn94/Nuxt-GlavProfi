/**
 * 📍 Эндпоинт: POST /api/auth/login
 * 
 * Назначение:
 * - Аутентификация пользователя по логину и паролю
 * - Генерация JWT-токена и создание серверной сессии
 * - Возврат данных пользователя для инициализации клиента
 * 
 * ⚠️ ВАЖНО: Это публичный эндпоинт (в PUBLIC_PATHS мидлвара).
 * Он НЕ требует авторизации — он её СОЗДАЁТ.
 * 
 * @body { login: string, password: string }
 * @returns { token: string, user: UserData, sessionId: string }
 * 
 * Примеры ответов:
 * ✅ Успех: { token: "eyJ...", user: { id: 1, ... }, sessionId: "sess_..." }
 * ❌ Ошибка: 401 { statusMessage: "Неверные учётные данные" }
 */

import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { generateToken } from '../../utils/jwt'
import bcryptjs from 'bcryptjs'
import { eventHandler, readBody, createError, getRequestHeader, getRequestIP } from 'h3'
import { getObjectsByUser } from '../../utils/objects'
import { createSession, closeZombieSessions } from '../../utils/sessions'

interface LoginBody {
  login: string
  password: string
}

export default eventHandler(async (event) => {
  // ============================================
  // 1. ЧТЕНИЕ И ВАЛИДАЦИЯ ТЕЛА ЗАПРОСА
  // ============================================
  const body = await readBody<LoginBody>(event)
  
  if (!body?.login || !body?.password) {
    console.log('[Auth/Login] ⚠️ Пустой логин или пароль')
    throw createError({ 
      statusCode: 400, 
      statusMessage: 'Логин и пароль обязательны' 
    })
  }

  // Получаем информацию о запросе для сессии
  const ipAddress = getRequestIP(event, { xForwardedFor: true })
  const userAgent = getRequestHeader(event, 'user-agent') || undefined

  // ============================================
  // 2. ПОИСК ПОЛЬЗОВАТЕЛЯ В БД
  // ============================================
  const [user] = await db.select().from(users).where(eq(users.login, body.login))

  if (!user) {
    // ✅ Не раскрываем, что именно не так (логин или пароль) — защита от перебора
    console.log(`[Auth/Login] ⚠️ Пользователь "${body.login}" не найден`)
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Неверные учётные данные' 
    })
  }

  // ============================================
  // 3. ПРОВЕРКА ПАРОЛЯ
  // ============================================
  const isPasswordValid = await bcryptjs.compare(body.password, user.password)
  
  if (!isPasswordValid) {
    console.log(`[Auth/Login] ⚠️ Неверный пароль для пользователя "${body.login}"`)
    throw createError({ 
      statusCode: 401, 
      statusMessage: 'Неверные учётные данные' 
    })
  }

  // ============================================
  // 4. ПОДГОТОВКА ДАННЫХ ДЛЯ ТОКЕНА
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
  // 5. СОЗДАНИЕ СЕССИИ
  // ============================================
  // ✅ Закрываем старые "зомби"-сессии перед созданием новой
  // Это предотвращает накопление неактивных сессий в БД
  await closeZombieSessions(user.id)
  
  const session = await createSession(user.id, ipAddress, userAgent)

  // ============================================
  // 6. ФОРМИРОВАНИЕ ОТВЕТА
  // ============================================
  console.log(`[Auth/Login] ✅ Успешный вход: ${user.login} (ID: ${user.id})`)
  
  return { 
    token,
    user: {
      id: user.id,
      login: user.login,      // ✅ Поле login, а не email (соответствует клиенту)
      name: user.name || user.login,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: true
    },
    sessionId: session?.sessionId // Возвращаем ID сессии для сокета
  }
})
