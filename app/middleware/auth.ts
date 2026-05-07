// middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import { useAuthStore } from '../../stores/auth'

export default defineNuxtRouteMiddleware(async (to: { path: string }) => {
  const rawCookie = useCookie('auth_token').value
  let isAuthenticated = false
  
  if (rawCookie) {
    try {
      const parsed = JSON.parse(rawCookie)
      isAuthenticated = !!(parsed.token && parsed.userId)
    } catch {
      isAuthenticated = rawCookie.length > 20
    }
  }

  // 🔐 Если авторизован и заходим в /cabinet — ждём инициализацию стора
  if (isAuthenticated && to.path.startsWith('/cabinet')) {
    const authStore = useAuthStore()
    
    // ✅ Ждём completion init(), если данные ещё не загружены
    if (!authStore.isAuthenticated || !authStore.user?.role) {
      await authStore.init()
    }
  }

  // Редиректы
  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/cabinet')
  }
  if (!isAuthenticated && to.path.startsWith('/cabinet')) {
    return navigateTo('/login')
  }
})
