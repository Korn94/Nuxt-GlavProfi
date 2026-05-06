/**
 * 📍 Эндпоинт: GET /api/auth/check
 * 
 * Назначение:
 * - Фоновая проверка валидности токена после гидратации стора
 * - Возврат полных данных пользователя при успешной верификации
 * - Используется в `authStore.init()` для восстановления сессии после F5
 * 
 * ⚠️ ВАЖНО: Эндпоинт находится в `PUBLIC_PATHS` мидлвара,
 * поэтому он САМ отвечает за проверку токена и возврат 401 при ошибке.
 * Это позволяет клиенту мягко обработать ситуацию (разлогинить пользователя).
 * 
 * @returns { user: UserData } при успехе
 * @throws 401 при отсутствии/невалидности токена
 * 
 * Примеры ответов:
 * ✅ Успех: { user: { id: 1, login: "admin", role: "admin", name: "Александр", ... } }
 * ❌ Ошибка: 401 Unauthorized
 */

import { defineEventHandler, createError } from 'h3'
import { db } from '../../db'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
import { verifyToken } from '../../utils/jwt'
import { extractJwt } from '../../utils/cookies' // ✅ Централизованный хелпер парсинга куки

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ИЗВЛЕЧЕНИЕ ТОКЕНА
  // ============================================
  // ✅ Используем централизованный хелпер (поддержка старого и нового формата куки)
  const token = extractJwt(event)

  // Если токена нет — это ошибка для этого эндпоинта (он предназначен только для проверки авторизации)
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Требуется авторизация' })
  }

  try {
    // ============================================
    // 2. ВЕРИФИКАЦИЯ ТОКЕНА
    // ============================================
    const payload = await verifyToken(token)
    
    // ✅ Строгая проверка формата payload.id (защита от невалидных токенов)
    if (typeof payload.id !== 'number') {
      console.log('[Auth/Check] ⚠️ Токен содержит некорректный payload.id')
      throw createError({ statusCode: 401, statusMessage: 'Неверный формат токена' })
    }

    // ============================================
    // 3. ПОЛУЧЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ИЗ БД
    // ============================================
    const [user] = await db.select().from(users).where(eq(users.id, payload.id))
    
    if (!user) {
      console.log(`[Auth/Check] ⚠️ Пользователь с ID ${payload.id} не найден в БД`)
      throw createError({ statusCode: 401, statusMessage: 'Пользователь не найден' })
    }

    // ============================================
    // 4. ФОРМИРОВАНИЕ ОТВЕТА
    // ============================================
    // ✅ Возвращаем данные в формате, ожидаемом authStore
    return {
      user: {
        id: user.id,
        login: user.login,
        role: user.role,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    }
  } catch (error) {
    // ============================================
    // 5. ОБРАБОТКА ОШИБОК
    // ============================================
    // Логируем детали на сервере (для отладки)
    console.error('[Auth/Check] Ошибка проверки токена:', error)
    
    // ✅ Не раскрываем детали ошибки клиенту — возвращаем общий 401
    // Клиент (authStore) сам решит, как обработать эту ситуацию
    throw createError({ statusCode: 401, statusMessage: 'Недействительный токен' })
  }
})
