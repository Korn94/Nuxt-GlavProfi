// app/middleware/auth.global.ts
/**
 * Глобальный auth-гвард-страховка для страниц кабинета.
 *
 * Выполняется только для /cabinet и /login. Публичные страницы (прайс,
 * портфолио и т.п.) НЕ трогаем: там админ распознаётся через
 * useCurrentUser() → /api/me (SSR-безопасно), а вызов useAuthStore()
 * в глобальном middleware валил SSR публичных страниц в HTTP 500.
 *
 * Гарантирует, что `authStore.init()` вызывается даже на страницах кабинета,
 * где забыли/закомментировали `middleware: ['auth']` в definePageMeta —
 * иначе `isChecking` зависает в `true` и layout кабинета показывает
 * бесконечный спиннер «Проверка сессии...».
 */
import { defineNuxtRouteMiddleware } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import { runAuthGuard } from '~/utils/runAuthGuard'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  if (to.path.startsWith('/cabinet') || to.path === '/login') {
    return runAuthGuard(to)
  }
})
