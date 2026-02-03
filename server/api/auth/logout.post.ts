// server/api/auth/logout.post.ts
import { eventHandler, getCookie, createError } from 'h3'
import { endSession } from '../../utils/sessions'
import { verifyToken } from '../../utils/jwt'

export default eventHandler(async (event) => {
  try {
    // Получаем токен и sessionId из кук
    const token = getCookie(event, 'auth_token')
    const sessionId = getCookie(event, 'session_id')
    
    if (!token) {
      // Если токена нет, просто возвращаем успех
      return { success: true }
    }
    
    // Верифицируем токен
    const payload = await verifyToken(token)
    
    // Завершаем сессию пользователя, если есть sessionId
    if (sessionId) {
      await endSession(sessionId)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    // Даже при ошибке возвращаем успех, чтобы пользователь мог выйти
    return { success: true }
  }
})
