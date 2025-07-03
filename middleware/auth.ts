// middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized, from: RouteLocationNormalized) => {
  const token = useCookie('token')

  // Если пользователь уже авторизован и заходит на /login — перенаправляем в /cabinet
  if (token.value && to.path === '/login') {
    return navigateTo('/cabinet')
  }

  // Если пользователь не авторизован и пытается зайти в /cabinet — редирект на /login
  if (!token.value && to.path === '/cabinet') {
    return navigateTo('/login')
  }
})