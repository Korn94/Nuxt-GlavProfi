import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const allowedRoles = to.meta?.allowedRoles as string[] | undefined

  // 📍 Если для маршрута не указаны разрешённые роли — пропускаем
  if (!allowedRoles || allowedRoles.length === 0) {
    return
  }

  const authCookie = useCookie('auth_token')
  const rawValue = authCookie.value

  if (!rawValue) {
    return navigateTo('/login')
  }

  let userRole: string | null = null

  try {
    // ✅ Новый формат: JSON-строка { token, userId, role }
    const payload = JSON.parse(rawValue)
    userRole = payload.role || null
  } catch {
    // 🔄 Старый формат или повреждённая кука — безопасный редирект на логин
    // (при следующем входе кука автоматически перезапишется в новом формате)
    console.warn('[Middleware/Role] Не удалось распарсить куку роли, требуется повторный вход')
    return navigateTo('/login')
  }

  // ✅ Мгновенная проверка доступа по роли
  if (!userRole || !allowedRoles.includes(userRole)) {
    return navigateTo('/access-denied')
  }
})
