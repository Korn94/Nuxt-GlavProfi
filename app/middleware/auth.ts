// middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to: { path: string }) => {
  const authCookie = useCookie('auth_token')
  const rawValue = authCookie.value

  let isAuthenticated = false

  if (rawValue) {
    try {
      // ✅ Новый формат: JSON-строка { token, userId, role }
      const payload = JSON.parse(rawValue)
      isAuthenticated = !!(payload.token && payload.userId)
    } catch {
      // 🔄 Старый формат (просто строка JWT) — для плавного перехода
      isAuthenticated = rawValue.length > 20
    }
  }

  // 📍 Если пользователь авторизован и пытается зайти на /login → редирект в кабинет
  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/cabinet')
  }

  // 📍 Если пользователь не авторизован и пытается зайти в /cabinet/** → редирект на логин
  if (!isAuthenticated && to.path.startsWith('/cabinet')) {
    return navigateTo('/login')
  }
})
