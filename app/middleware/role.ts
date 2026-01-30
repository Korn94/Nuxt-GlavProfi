// middleware/role.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  const token = useCookie('auth_token')

  // Проверка: авторизован ли пользователь
  if (!token.value) {
    return navigateTo('/login')
  }

  try {
    // Используем $fetch вместо useFetch
    const data = await $fetch<{ user: { role: string } }>('/api/me')

    const userRole = data.user.role
    const allowedRoles = to.meta?.allowedRoles as string[] | undefined

    if (allowedRoles && !allowedRoles.includes(userRole)) {
      return navigateTo('/access-denied')
    }
  } catch (error) {
    // Если /api/me вернул 401 или ошибка — разлогиниваем
    return navigateTo('/login')
  }
})
