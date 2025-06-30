// middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to, from) => {
  const token = useCookie('token')

  // Если пользователь уже авторизован и заходит на /login — перенаправляем в /cabinet
  if (token.value && to.path === '/login') {
    return navigateTo('/cabinet')
  }

  // Если пользователь не авторизован и пытается зайти в /cabinet — перенаправляем на /login
  if (!token.value && to.path.startsWith('/cabinet')) {
    return navigateTo('/login')
  }
})