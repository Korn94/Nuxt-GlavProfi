// app/composables/useCurrentUser.ts
/**
 * 🧑 Глобальный composable для получения текущего пользователя.
 *
 * ✅ SSR-SAFE: useFetch автоматически пробрасывает cookie из request event
 * ✅ Кэшируется Nuxt по ключу 'current-user' — данные попадают в payload
 * ✅ Клиент гидратирует те же данные — нет hydration mismatch
 *
 * Источники:
 * - SSR: useFetch → /api/me → cookie пробрасываются автоматически
 * - Client: гидратация из payload (без повторного запроса)
 */
import { useFetch, clearNuxtData } from 'nuxt/app'
import type { User } from '~/types'

interface CurrentUserResponse {
  user: User | null
}

export function useCurrentUser() {
  return useFetch<CurrentUserResponse>('/api/me', {
    key: 'current-user',
    server: true,
    lazy: false,
    // При ошибке (401, нет cookie) — возвращаем null
    default: () => ({ user: null }),
  })
}

/**
 * Принудительный сброс кэша (вызывать при логине/логауте).
 */
export function clearCurrentUser() {
  clearNuxtData('current-user')
}
