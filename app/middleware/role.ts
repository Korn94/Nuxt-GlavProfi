// middleware/role.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const allowedRoles = to.meta?.allowedRoles as string[] | undefined

  // Если для маршрута не указаны разрешённые роли — пропускаем
  if (!allowedRoles || allowedRoles.length === 0) return

  const rawCookie = useCookie('auth_token').value
  if (!rawCookie) return navigateTo('/login')

  let userRole: string | null = null

  try {
    // ✅ Парсим JSON-куку и достаём роль
    const parsed = JSON.parse(rawCookie)
    userRole = parsed.role || null
  } catch {
    // Повреждённая кука → безопасный редирект на логин
    console.log('[Middleware/Role] Кука повреждена, требуется повторный вход')
    return navigateTo('/login')
  }

  // ✅ Мгновенная проверка: роль есть и входит в разрешённые?
  if (!userRole || !allowedRoles.includes(userRole)) {
    return navigateTo('/access-denied')
  }
})
