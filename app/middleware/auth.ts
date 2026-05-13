// app/middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import { useAuthStore } from '../../stores/auth'

/**
 * Проверяет наличие валидного токена в куке
 * Поддерживает новый JSON-формат { token, userId, role } и старый строковый формат
 */
function hasValidAuthCookie(): boolean {
  const raw = useCookie('auth_token').value
  if (!raw) return false

  try {
    const parsed = JSON.parse(raw)
    return !!(parsed.token && parsed.userId)
  } catch {
    // Старый формат: простая строка JWT (длина > 20 символов)
    // Если это не строка токена — удаляем куку как невалидную
    if (raw.length <= 20) {
      console.log('[Middleware/Auth] Старая или невалидная кука удалена')
      useCookie('auth_token').value = null
      return false
    }
    return true
  }
}

export default defineNuxtRouteMiddleware(async (to: { path: string }) => {
  const isAuthenticated = hasValidAuthCookie()

  // 🔐 Если авторизован и заходим в защищённую зону — ждём загрузки данных пользователя
  if (isAuthenticated && to.path.startsWith('/cabinet')) {
    const authStore = useAuthStore()
    
    // Загружаем полные данные, только если проверка ещё не завершилась
    if (authStore.isChecking) {
      await authStore.init().catch(() => {
        // Если проверка упала (например, токен протух), сброс происходит внутри init().
        // Игнорируем ошибку, чтобы не блокировать навигацию и дать сработать редиректу на /login
      })
    }
  }

  // 🔄 Редиректы
  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/cabinet')
  }
  
  if (!isAuthenticated && to.path.startsWith('/cabinet')) {
    return navigateTo('/login')
  }
})
