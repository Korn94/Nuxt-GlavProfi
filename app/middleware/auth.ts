// middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'

export default defineNuxtRouteMiddleware((to: { path: string }) => {
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

  if (isAuthenticated && to.path === '/login') {
    return navigateTo('/cabinet')
  }
  if (!isAuthenticated && to.path.startsWith('/cabinet')) {
    return navigateTo('/login')
  }
})
