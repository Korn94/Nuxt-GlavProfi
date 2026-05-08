// middleware/role.ts
/**
 * Middleware для проверки доступа по уровню роли
 * 
 * ✅ Использует иерархическую проверку через ROLE_LEVELS
 * allowedRoles: ['foreman'] → доступ есть у foreman, manager, admin
 * 
 * @example
 * definePageMeta({
 *   middleware: 'role',
 *   allowedRoles: ['foreman'] // минимальный требуемый уровень
 * })
 */

import { defineNuxtRouteMiddleware, useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import type { Role } from '~/types/permissions'
import { ROLE_LEVELS } from '~/types/permissions'

export default defineNuxtRouteMiddleware((to: RouteLocationNormalized) => {
  const allowedRoles = to.meta?.allowedRoles as Role[] | undefined

  // Если для маршрута не указаны разрешённые роли — пропускаем всех авторизованных
  if (!allowedRoles || allowedRoles.length === 0) return

  const rawCookie = useCookie('auth_token').value
  if (!rawCookie) return navigateTo('/login')

  let userRole: Role | null = null

  try {
    // Парсим JSON-куку и достаём роль
    const parsed = JSON.parse(rawCookie)
    userRole = parsed.role as Role || null
  } catch {
    // Повреждённая кука → безопасный редирект на логин
    console.log('[Middleware/Role] Кука повреждена, требуется повторный вход')
    return navigateTo('/login')
  }

  // ============================================
  // ✅ ИЕРАРХИЧЕСКАЯ ПРОВЕРКА УРОВНЯ РОЛИ
  // ============================================
  if (!userRole) {
    return navigateTo('/access-denied')
  }

  // Находим минимальный требуемый уровень из списка allowedRoles
  const minRequiredLevel = Math.min(
    ...allowedRoles.map(role => ROLE_LEVELS[role] ?? Infinity)
  )

  const userLevel = ROLE_LEVELS[userRole] ?? 0

  // ✅ Доступ разрешён, если уровень пользователя >= минимального требуемого
  if (userLevel < minRequiredLevel) {
    console.log(`[Middleware/Role] Доступ запрещён: уровень ${userRole} (${userLevel}) < требуемого (${minRequiredLevel})`)
    return navigateTo('/access-denied')
  }

  // ✅ Все проверки пройдены
  return
})
