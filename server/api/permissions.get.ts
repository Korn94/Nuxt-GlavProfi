// server/api/permissions.get.ts
/**
 * 📍 Эндпоинт: GET /api/permissions
 *
 * Назначение:
 * Получить права текущего пользователя (используется после логина и при обновлении токена)
 *
 * ⚠️ Находится в PUBLIC_PATHS мидлвара — САМ проверяет токен через extractJwt
 *
 * Возвращает только новую систему прав (без legacy):
 * - role: роль пользователя
 * - level: уровень роли (для иерархии)
 * - pages: права на уровне страниц (canView, canCreate, canEdit, canDelete, canSpecial)
 *
 * @returns { role, level, pages }
 *
 * Пример ответа:
 * {
 *   "role": "master",
 *   "level": 2,
 *   "pages": {
 *     "dashboard": { "canView": true, "canCreate": false, "canEdit": false, "canDelete": false, "canSpecial": false },
 *     "objects": { "canView": true, "canCreate": false, "canEdit": true, "canDelete": false, "canSpecial": false },
 *     "comings": { "canView": false, "canCreate": false, "canEdit": false, "canDelete": false, "canSpecial": false },
 *     ...
 *   }
 * }
 */
import { defineEventHandler, createError } from 'h3'
import { verifyToken } from '../utils/jwt'
import { extractJwt } from '../utils/cookies'
import { db } from '../db'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getUserPermissionsResponse } from '../utils/permissions'

export default defineEventHandler(async (event) => {
  // ============================================
  // 1. ИЗВЛЕЧЕНИЕ ТОКЕНА
  // ============================================
  const token = extractJwt(event)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Требуется авторизация'
    })
  }

  try {
    // ============================================
    // 2. ВЕРИФИКАЦИЯ ТОКЕНА
    // ============================================
    const payload = await verifyToken(token)
    if (typeof payload.id !== 'number') {
      console.log('[Permissions] ⚠️ Некорректный payload.id')
      throw createError({ statusCode: 401, statusMessage: 'Неверный формат токена' })
    }

    // ============================================
    // 3. ПОЛУЧЕНИЕ ПОЛЬЗОВАТЕЛЯ ИЗ БД
    // ============================================
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1)

    if (!user) {
      console.log(`[Permissions] ⚠️ Пользователь ${payload.id} не найден`)
      throw createError({ statusCode: 401, statusMessage: 'Пользователь не найден' })
    }

    // ============================================
    // 4. ВОЗВРАТ ПРАВ (ТОЛЬКО НОВАЯ СИСТЕМА)
    // ============================================
    const response = await getUserPermissionsResponse(user)
    return response

  } catch (error: any) {
    console.error('[Permissions] Ошибка:', error)

    // Пробрасываем наши 401 ошибки как есть
    if (error.statusCode === 401) throw error

    // Иначе — общий 401 без деталей
    throw createError({
      statusCode: 401,
      statusMessage: 'Недействительный токен'
    })
  }
})
