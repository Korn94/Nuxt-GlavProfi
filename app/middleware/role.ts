// middleware/role.ts
/**
 * 🛡️ Middleware для проверки доступа по уровню роли
 *
 * Архитектура:
 * - Работает ПОСЛЕ `auth` middleware (который вызвал authStore.init())
 * - Роль берётся из authStore.user.role (данные уже загружены)
 * - Использует иерархическую проверку через ROLE_LEVELS
 *
 * Иерархия ролей (из shared/constants/roles):
 *   worker(1) → master(2) → foreman(3) → manager(4) → admin(5)
 *
 * @example
 * // В странице:
 * definePageMeta({
 *   middleware: ['auth', 'role'],
 *   allowedRoles: ['foreman']  // доступ есть у foreman, manager, admin
 * })
 *
 * @example
 * // Несколько минимальных ролей:
 * definePageMeta({
 *   middleware: ['auth', 'role'],
 *   allowedRoles: ['manager', 'foreman']  // берётся минимальный уровень
 * })
 */

import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from 'stores/auth'
import { ROLE_LEVELS, type Role } from 'shared/constants/roles'

export default defineNuxtRouteMiddleware(async (to: RouteLocationNormalized) => {
  const allowedRoles = to.meta?.allowedRoles as Role[] | undefined

  // Если для маршрута не указаны разрешённые роли — пропускаем всех
  if (!allowedRoles || allowedRoles.length === 0) {
    return
  }

  const authStore = useAuthStore()
  const hasCookie = hasValidAuthCookie()

  // ============================================
  // 🔴 SSR: НЕ делаем редирект если есть cookie
  // ============================================
  // Даём клиенту шанс загрузить данные.
  // Это предотвращает ложные редиректы на SSR.
  if (import.meta.server) {
    if (!hasCookie) {
      return navigateTo({
        path: '/login',
        query: to.fullPath !== '/cabinet' ? { redirect: to.fullPath } : undefined
      })
    }
    // Cookie есть — пропускаем (клиент проверит роль)
    return
  }

  // ============================================
  // 🟢 CLIENT: ждём init() если нужно
  // ============================================
  if (authStore.isChecking) {
    try {
      await authStore.init()
    } catch {
      // init() упал — токен протух
    }
  }

  // ============================================
  // ПРОВЕРКА ПОСЛЕ init()
  // ============================================
  const userRole = authStore.user?.role as Role | undefined

  // Пользователь не авторизован
  if (!userRole) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }

  // Находим минимальный требуемый уровень
  const minRequiredLevel = Math.min(
    ...allowedRoles.map(role => ROLE_LEVELS[role] ?? Infinity)
  )

  const userLevel = ROLE_LEVELS[userRole] ?? 0

  // Сравниваем уровни
  if (userLevel < minRequiredLevel) {
    console.log(
      `[Middleware/Role] ❌ Доступ запрещён: ${userRole}(${userLevel}) < min(${minRequiredLevel})`
    )
    return navigateTo('/access-denied')
  }

  // ✅ Доступ разрешён
})

/**
 * Проверяет наличие валидного токена в куке
 */
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
