// app/composables/useCurrentUser.ts
/**
 * 🧑 Глобальный composable для получения текущего пользователя.
 *
 * ✅ Кэшируется Nuxt по ключу 'current-user' — запрос выполняется ОДИН раз
 *    за всё время жизни приложения (пока не истечёт cookie).
 * ✅ Используется на публичных страницах (прайс, главная, услуги).
 * ✅ НЕ требует полной инициализации auth-стора (permissions, roleLevel).
 *
 * Источники:
 * - SSR: читает cookie через extractJwt → верифицирует токен → достаёт юзера
 * - Client: делает $fetch('/api/me') один раз, результат кэшируется
 */
import { useAsyncData, useNuxtApp, clearNuxtData } from 'nuxt/app'
import type { User } from '~/types'

interface CurrentUserResponse {
  user: User | null
}

export function useCurrentUser() {
  return useAsyncData<CurrentUserResponse>(
    'current-user',
    () => $fetch<CurrentUserResponse>('/api/me'),
    {
      server: true,
      lazy: false,
      default: () => ({ user: null }),
    },
  )
}

/**
 * Принудительный сброс кэша (вызывать при логине/логауте).
 */
export function clearCurrentUser() {
  // ==========================================
  // ВАРИАНТ 1: Официальный composable Nuxt (Рекомендуемый)
  // ==========================================
  // clearNuxtData полностью сбрасывает состояние useAsyncData 
  // (data, error, status) и удаляет его из payload.
  clearNuxtData('current-user')

  // ==========================================
  // ВАРИАНТ 2: Ручной сброс (если нужна строгая типизация { user: null } сразу)
  // ==========================================
  // Если после clearNuxtData компоненты падают из-за undefined, 
  // можно использовать ручной сброс без обращения к _default:
  
  /*
  const nuxtApp = useNuxtApp()
  
  if (nuxtApp.payload.data['current-user'] !== undefined) {
    delete nuxtApp.payload.data['current-user']
  }
  
  const asyncData = nuxtApp._asyncData['current-user']
  if (asyncData) {
    // ✅ Присваиваем дефолтный объект напрямую, избегая внутренних свойств Nuxt
    asyncData.data.value = { user: null } 
    asyncData.error.value = undefined
    asyncData.status.value = 'idle'
  }
  */
}
