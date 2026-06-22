// server/api/permissions/index.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions
 *
 * Назначение:
 * - Получить права текущего пользователя
 * - Используется после логина и при обновлении токена (F5, гидратация)
 * - Вызывается из authStore.init() параллельно с /api/auth/check
 *
 * ⚠️ Публичный эндпоинт (в PUBLIC_PATHS мидлвара) — САМ проверяет токен.
 * Это позволяет клиенту мягко обработать 401 (разлогинить пользователя).
 *
 * @returns { role, level, pages }
 */

import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { users } from '../../db/schema'
import { verifyToken } from '../../utils/jwt'
import { extractJwt } from '../../utils/cookies'
import { getUserPermissionsResponse } from '../../utils/permissions'

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ИЗВЛЕЧЕНИЕ И ВЕРИФИКАЦИЯ ТОКЕНА
  // ============================================
  const token = extractJwt(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Требуется авторизация'
    })
  }

  const payload = await verifyToken(token).catch(() => {
    throw createError({
      statusCode: 401,
      statusMessage: 'Недействительный или истёкший токен'
    })
  })

  if (typeof payload.id !== 'number') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Неверный формат токена'
    })
  }

  // ============================================
  // 2. ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ИЗ БД
  // ============================================
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.id))
    .limit(1)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Пользователь не найден'
    })
  }

  // ============================================
  // 3. ВОЗВРАТ ПРАВ
  // ============================================
  // getUserPermissionsResponse использует кэш (5 мин TTL)
  // и возвращает role + level + pages
  return await getUserPermissionsResponse(user)
})
