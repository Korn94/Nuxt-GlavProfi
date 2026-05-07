// app/composables/useApi.ts
/**
 * Единый HTTP-клиент с автоматической подстановкой токена и обработкой ошибок.
 * 
 * ⚠️ Читаем токен напрямую из куки, чтобы избежать циклических зависимостей с authStore.
 * 
 * @example
 * const api = useApi()
 * const data = await api.get('/api/objects')
 * await api.post('/api/users', { name: 'Test' })
 */

import type { FetchOptions } from 'ofetch'
import { useCookie, navigateTo } from '#app'

export function useApi() {
  /**
   * Безопасное извлечение JWT из куки (поддержка старого и нового формата)
   */
  function extractJwt(): string | null {
    const raw = useCookie('auth_token').value
    if (!raw) return null

    try {
      // Новый формат: JSON { token, userId, role }
      const parsed = JSON.parse(raw)
      return parsed.token || null
    } catch {
      // Старый формат: просто строка JWT
      return raw.length > 20 ? raw : null
    }
  }

  /**
   * Базовая функция запроса
   */
  async function request<T>(url: string, options: FetchOptions = {}): Promise<T> {
    const token = extractJwt()

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }

    try {
      return await $fetch<T>(url, {
        ...options,
        headers,
        credentials: options.credentials || 'include',
        // ✅ Фикс: Nuxt $fetch требует строгие литералы метода, приводим тип
        method: options.method as any
      })
    } catch (error: any) {
      // 🔐 401 — токен невалиден или истёк
      if (error.status === 401) {
        console.warn('[useApi] Токен невалиден, выполняем выход')
        // ✅ Удаляем куки напрямую, чтобы избежать циклической зависимости с authStore
        useCookie('auth_token').value = null
        useCookie('session_id').value = null
        if (process.client && window.location.pathname !== '/login') {
          navigateTo('/login', { replace: true, external: false })
        }
      }

      // 🚫 403 — нет прав доступа
      if (error.status === 403) {
        console.warn('[useApi] Доступ запрещён:', error.data?.message || error.message)
      }

      throw error
    }
  }

  /** GET запрос */
  function get<T>(url: string, options?: FetchOptions) {
    return request<T>(url, { ...options, method: 'GET' })
  }

  /** POST запрос */
  function post<T>(url: string, body?: any, options?: FetchOptions) {
    return request<T>(url, { ...options, method: 'POST', body })
  }

  /** PUT запрос */
  function put<T>(url: string, body?: any, options?: FetchOptions) {
    return request<T>(url, { ...options, method: 'PUT', body })
  }

  /** PATCH запрос */
  function patch<T>(url: string, body?: any, options?: FetchOptions) {
    return request<T>(url, { ...options, method: 'PATCH', body })
  }

  /** DELETE запрос */
  function del<T>(url: string, options?: FetchOptions) {
    return request<T>(url, { ...options, method: 'DELETE' })
  }

  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del
  }
}
