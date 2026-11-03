// app/utils/runAuthGuard.ts
/**
 * Единая логика auth-гварда (single source of truth).
 *
 * Раньше проверка авторизации жила только в именованном middleware
 * (app/middleware/auth.ts) и подключалась постранично через
 * `definePageMeta({ middleware: ['auth'] })`. Если на странице кабинета
 * middleware забывали/комментировали, `authStore.init()` не вызывался,
 * `isChecking` оставался `true` и layout кабинета показывал бесконечный
 * спиннер «Проверка сессии...».
 *
 * Теперь логика вынесена сюда и вызывается из:
 * - app/middleware/auth.global.ts — страховка для страниц кабинета
 *   (выполняется только для /cabinet и /login, публичные страницы не трогает);
 * - app/middleware/auth.ts — тонкая обёртка для обратной совместимости
 *   со страницами, указывающими `middleware: ['auth']` в definePageMeta.
 *
 * ⚠️ Файл лежит в app/utils (НЕ в app/middleware), иначе Nuxt зарегистрирует
 * его как именованный middleware «run-auth-guard» без default-экспорта.
 */
import { useCookie, navigateTo } from '#app'
import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from 'stores/auth'

export async function runAuthGuard(to: RouteLocationNormalized) {
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

    // ✅ SSR-инициализация прав: загружаем пользователя и права на сервере,
    //    чтобы SSR-разметка совпадала с клиентской (кнопки, v-if, etc.)
    //    Гидратация Pinia на сервере не вызывается — ставим token вручную из cookie.
    if (hasCookie && authStore.isChecking) {
      const raw = useCookie('auth_token').value
      authStore.token = extractToken(raw)
      await authStore.init()
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
}

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

/**
 * Извлечь JWT из cookie (поддерживает новый plain и старый JSON форматы)
 */
function extractToken(raw: string | null | undefined): string | null {
  if (!raw) return null
  // Старый формат: JSON { token, userId, role }
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      return parsed.token || null
    } catch {
      return null
    }
  }
  return raw.length > 20 ? raw : null
}
