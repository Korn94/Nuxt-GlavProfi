// app/composables/useApi.ts
/**
 * Глобальный HTTP-клиент для API
 * 
 * ✅ Автоматически подставляет JWT из authStore
 * ✅ Глобально обрабатывает 401 (выход из системы) и 403 (уведомление)
 * ✅ Безопасен для SSR (интерцепторы работают только на клиенте)
 * ✅ Упрощённая типизация, совместимая с Nuxt 3/4
 */
import { useRuntimeConfig } from 'nuxt/app'
import { useAuthStore } from '../../stores/auth'
import { useNotifications } from '~/composables/useNotifications'

export const useApi = () => {
  const authStore = useAuthStore()
  const notifications = useNotifications()
  const config = useRuntimeConfig()

  const fetcher = $fetch.create({
    baseURL: (config.public.apiBase as string) || '',
    credentials: 'include',

    onRequest({ options }) {
      const token = authStore.token
      if (token) {
        const headers = new Headers(options.headers as HeadersInit)
        headers.set('Authorization', `Bearer ${token}`)
        options.headers = headers
      }
    },

    onResponseError({ response }) {
      // Интерцепторы срабатывают только на клиенте
      if (!process.client) return

      const url = response.url || ''
      const status = response.status

      if (status === 401) {
        // ⛔ Не вызываем logout для эндпоинтов авторизации, чтобы избежать зацикливания
        if (!url.includes('/api/auth/')) {
          console.warn('[useApi] ⚠️ Сессия истекла или токен невалиден (401). Выполняется выход...')
          authStore.logout()
        }
      } 
      else if (status === 403) {
        notifications.error('У вас нет прав для выполнения этой операции', 'Доступ запрещён')
      }
    }
  })

  // ✅ Упрощённые типы: избегаем сложных union-экстракций Nuxt
  type FetchOpts = Omit<NonNullable<Parameters<typeof fetcher>[1]>, 'method' | 'body'>
  type ApiBody = Record<string, any> | null

  return {
    get: <T = unknown>(url: string, opts?: FetchOpts) =>
      fetcher<T>(url, { ...opts, method: 'GET' as const }),

    post: <T = unknown>(url: string, body?: ApiBody, opts?: FetchOpts) =>
      fetcher<T>(url, { ...opts, body, method: 'POST' as const }),

    put: <T = unknown>(url: string, body?: ApiBody, opts?: FetchOpts) =>
      fetcher<T>(url, { ...opts, body, method: 'PUT' as const }),

    delete: <T = unknown>(url: string, opts?: FetchOpts) =>
      fetcher<T>(url, { ...opts, method: 'DELETE' as const }),
  }
}
