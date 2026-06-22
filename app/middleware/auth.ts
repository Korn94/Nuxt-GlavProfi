// app/middleware/auth.ts
import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { useAuthCookie } from '~/composables/useAuthCookie'

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  const authStore = useAuthStore()
  const hasCookie = hasValidAuthCookie()
  
  // ============================================
  // 🔴 SSR: НЕ делаем редирект если есть cookie
  // ============================================
  if (import.meta.server) {
    if (!hasCookie && to.path.startsWith('/cabinet')) {
      return navigateTo({
        path: '/login',
        query: to.fullPath !== '/cabinet' ? { redirect: to.fullPath } : undefined
      })
    }
    return
  }
  
  // ============================================
  // 🟢 CLIENT: полная проверка с ожиданием init()
  // ============================================
  
  // 1. НЕТ COOKIE — редирект на логин
  if (!hasCookie) {
    // ✅ ЯВНО сбрасываем isChecking, т.к. middleware не вызовет init()
    authStore.isChecking = false
    authStore.isAuthenticated = false
    
    // Для страницы /login без cookie — просто пропускаем (покажем форму)
    if (to.path === '/login') {
      return
    }
    
    if (to.path.startsWith('/cabinet')) {
      return navigateTo({
        path: '/login',
        query: to.fullPath !== '/cabinet' ? { redirect: to.fullPath } : undefined
      })
    }
    return
  }
  
  // 2. ЕСТЬ COOKIE — ждём завершения init()
  if (authStore.isChecking) {
    try {
      await authStore.init()
    } catch {
      // init() упал — токен протух
    }
  }
  
  // 3. ПРОВЕРКА ПОСЛЕ init()
  if (!authStore.isAuthenticated && to.path.startsWith('/cabinet')) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
  
  if (authStore.isAuthenticated && to.path === '/login') {
    const redirect = (to.query.redirect as string) || '/cabinet'
    return navigateTo(redirect)
  }
})

function hasValidAuthCookie(): boolean {
  const raw = useCookie('auth_token').value
  if (!raw) return false
  
  try {
    const parsed = JSON.parse(raw)
    return !!(parsed.token && parsed.userId)
  } catch {
    return raw.length > 20
  }
}
