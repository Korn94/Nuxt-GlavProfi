// server/api/auth/logout.post.ts
import { eventHandler, getCookie } from 'h3'
import { endSession } from '../../utils/sessions'
import { extractJwt } from '../../utils/cookies'

export default eventHandler(async (event) => {
  try {
    const token = extractJwt(event)
    const sessionId = getCookie(event, 'session_id')

    // 📍 Если токена нет — пользователь уже вышел или кука повреждена
    // Не ломаем флоу, просто возвращаем успех
    if (!token) {
      return { success: true }
    }

    // 📍 Завершаем серверную сессию, если есть sessionId
    if (sessionId) {
      await endSession(sessionId)
    }

    // ✅ Успешный выход
    return { success: true }
  } catch (error) {
    console.error('[Auth/Logout] Ошибка при выходе:', error)
    // Даже при ошибке сервера возвращаем успех, чтобы клиент очистил куки
    return { success: true }
  }
})
