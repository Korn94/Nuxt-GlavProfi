// middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to: { path: string }) => {
  const rawCookie = useCookie('auth_token').value

  let isAuthenticated = false

  if (rawCookie) {
    try {
      // ✅ Новый формат: JSON { token, userId, role }
      const parsed = JSON.parse(rawCookie)
      isAuthenticated = !!(parsed.token && parsed.userId)
    } catch {
      // 🔄 Старый формат: просто строка JWT (обратная совместимость)
      isAuthenticated = rawCookie.length > 20
    }
  }

  // 📍 Авторизован + пытается зайти на /login → редирект в кабинет
  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/cabinet')
  }

  // 📍 Не авторизован + пытается зайти в /cabinet/** → редирект на логин
  if (!isAuthenticated && to.path.startsWith('/cabinet')) {
    return navigateTo('/login')
  }
})
