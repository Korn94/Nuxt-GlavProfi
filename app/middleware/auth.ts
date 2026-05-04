// middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const token = useCookie('auth_token')

  // Если пользователь авторизован и пытается зайти на /login — редирект на /cabinet
  if (token.value && to.path === '/login') {
    return navigateTo('/cabinet')
  }

  // Если пользователь не авторизован и пытается зайти в любую страницу /cabinet/* — редирект на /login
  if (!token.value && to.path.startsWith('/cabinet')) {
    return navigateTo('/login')
  }

  // Если пользователь не авторизован и пытается зайти в /cabinet — редирект на /login
  if (!token.value && to.path === '/cabinet') {
    return navigateTo('/login')
  }
})
