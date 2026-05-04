// server/utils/cookies.ts
import { getCookie, getRequestHeader, type H3Event } from 'h3'

/**
 * Безопасно извлекает чистый JWT из куки или заголовка Authorization.
 * Поддерживает новый формат куки (JSON-объект) и старый (просто строка).
 */
export function extractJwt(event: H3Event, cookieName: string = 'auth_token'): string | null {
  // 1. Сначала проверяем заголовок (приоритет для API-клиентов/Postman)
  const authHeader = getRequestHeader(event, 'Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // 2. Если заголовка нет — парсим куку
  const rawCookie = getCookie(event, cookieName)
  if (!rawCookie) return null

  try {
    // Новый формат: JSON { token, userId, role }
    const parsed = JSON.parse(rawCookie)
    return parsed.token || null
  } catch {
    // Старый формат: просто строка JWT (обратная совместимость)
    return rawCookie.length > 20 ? rawCookie : null
  }
}
