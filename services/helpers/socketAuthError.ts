// services/helpers/socketAuthError.ts
/**
 * 🔐 Единая проверка «невалидная авторизация сокета».
 *
 * Зачем отдельный модуль:
 * - Раньше проверка была продублирована в нескольких слоях
 *   (services/socket.service.ts, app/plugins/socket.client.ts) и сверялась
 *   с английскими строками ('Unauthorized', 'Invalid token', 'User not found'),
 *   тогда как сервер отдаёт локализованные статус-сообщения
 *   ('Неверный или истёкший токен', 'Пользователь не найден', …) и 'No token provided'.
 *   Из-за этого автологаут по сокету фактически не срабатывал.
 * - Теперь источник правды один: isInvalidSocketAuthError() + handleInvalidSocketAuth().
 *
 * Источник сообщений: server/socket/middleware/auth.ts
 * (socketAuthMiddleware + authenticateUser через createError).
 */

import { useCookie } from '#app'

/**
 * Маркеры невалидной/истёкшей авторизации.
 * Сервер отдаёт их в CONNECT_ERROR.message (packet.data.message).
 */
const INVALID_AUTH_MARKERS: readonly string[] = [
  // socketAuthMiddleware: токен не передан
  'no token provided',
  // authenticateUser → createError(statusMessage)
  'неверный или истёкший токен',
  'пользователь не найден',
  'аккаунт заблокирован',
  'аккаунт удалён',
  // Англоязычные варианты — на случай смены формулировок на сервере
  'unauthorized',
  'invalid token',
  'user not found',
  'jwt expired'
]

/**
 * ⚠️ Сознательно НЕ включаем generic-сообщения ('ошибка аутентификации',
 * 'authentication failed'): их сервер отдаёт и при транзиентных сбоях
 * (например, ошибка БД в authenticateUser). В таких случаях лучше
 * переподключиться позже, чем разлогинить пользователя.
 */

/**
 * Защита от повторной очистки cookie/редиректа: connect_error может прийти
 * из нескольких слоёв (service, store, plugin) почти одновременно.
 */
let authResetInProgress = false

/**
 * Проверить, что ошибка подключения означает невалидную/истёкшую авторизацию.
 *
 * @param message текстовое сообщение ошибки (error.message из connect_error)
 */
export function isInvalidSocketAuthError(message?: string | null): boolean {
  if (!message) return false

  const normalized = String(message).toLowerCase()
  return INVALID_AUTH_MARKERS.some(marker => normalized.includes(marker))
}

/**
 * Очистить авторизационные cookie и увести пользователя на /login.
 *
 * Работает только на клиенте и выполняется ровно один раз за жизнь страницы.
 *
 * @returns true — состояние было очищено этим вызовом, false — уже очищено/не клиент
 */
export function handleInvalidSocketAuth(message?: string): boolean {
  if (!process.client || authResetInProgress) return false

  authResetInProgress = true
  console.warn(
    '[SocketAuthError] 🔐 Невалидная авторизация сокета — очищаем состояние:',
    message || 'причина не указана'
  )

  try {
    useCookie('auth_token').value = null
    useCookie('session_id').value = null
  } catch (error) {
    console.error('[SocketAuthError] ❌ Не удалось очистить cookie:', error)
  }

  try {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  } catch (error) {
    console.error('[SocketAuthError] ❌ Не удалось перейти на /login:', error)
  }

  return true
}
