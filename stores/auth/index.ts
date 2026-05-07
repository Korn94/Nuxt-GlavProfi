// stores/auth/index.ts

import { defineStore } from 'pinia'
import { useCookie, useRouter } from 'nuxt/app'
import { useNotifications } from '~/composables/useNotifications'
import { useApi } from '~/composables/useApi'
import type { User } from '~/types'

interface AuthState {
  token: string | null
  user: User | null
  sessionId: string | null
  isAuthenticated: boolean
  isChecking: boolean
  error: string | null
}

interface AuthResponse {
  token: string
  user: User
  sessionId: string
}

// ✅ Структура данных, которую будем хранить в одной куке
interface AuthCookiePayload {
  token: string
  userId: number
  role: string
}

function parseAuthToken() {
  const raw = useCookie('auth_token').value
  if (!raw) return null
  try { return JSON.parse(raw).token || null }
  catch { return raw.length > 20 ? raw : null }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null, // ✅ Теперь всегда чистый JWT или null
    user: null,
    sessionId: null,
    isAuthenticated: false,
    isChecking: true,
    error: null
  }),

  getters: {
    getToken: (state) => state.token,
    getUser: (state) => state.user,
    getIsAuthenticated: (state) => state.isAuthenticated,
    getIsChecking: (state) => state.isChecking,
    getError: (state) => state.error
  },

  actions: {
    /**
     * Инициализация хранилища - проверка текущего состояния аутентификации
     */
    async init() {
      try {
        this.isChecking = true
        this.error = null

        // 👇 Используем уже гидратированное состояние
        if (!this.token) {
          this.resetState()
          return
        }

        // Проверяем токен на сервере
        const api = useApi()
        const { user } = await api.get<{ user: User }>('/api/auth/check')

        // Обновляем полные данные пользователя с сервера
        this.user = user
        this.isAuthenticated = true

      } catch (error) {
        console.error('[AuthStore] Ошибка проверки авторизации:', error)
        this.resetState()
        // ✅ Добавляем редирект, если проверка не прошла
        if (process.client) {
          const { navigateTo } = await import('#app')
          navigateTo('/login')
        }
      } finally {
        this.isChecking = false
      }
    },

    /**
     * Аутентификация пользователя
     */
    async login(credentials: { login: string; password: string } | { telegramData: any }) {
      const notifications = useNotifications()
      try {
        this.error = null
        this.isChecking = true
        let response: AuthResponse

        const api = useApi()

        // Определяем тип аутентификации
        if ('telegramData' in credentials) {
          response = await api.post<AuthResponse>('/api/auth/telegram', credentials.telegramData)
        } else {
          response = await api.post<AuthResponse>('/api/auth/login', credentials)
        }

        // ✅ Сохраняем токен в куку в новом JSON-формате
        const cookiePayload: AuthCookiePayload = {
          token: response.token,
          userId: response.user.id,
          role: response.user.role
        }

        const tokenCookie = useCookie('auth_token', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
        tokenCookie.value = JSON.stringify(cookiePayload)

        // Сохраняем sessionId в отдельную куку
        const sessionIdCookie = useCookie('session_id', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
        sessionIdCookie.value = response.sessionId

        // Обновляем состояние
        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true
        this.sessionId = response.sessionId

        notifications.success(`Добро пожаловать, ${response.user.name}!`)

        const router = useRouter()
        router.push('/cabinet')

        return response
      } catch (error: any) {
        console.error('[AuthStore] Ошибка входа:', error)

        let errorMessage = 'Ошибка авторизации'
        if (error.data?.message) errorMessage = error.data.message
        else if (error.message) errorMessage = error.message

        this.error = errorMessage
        notifications.error(errorMessage, 'Ошибка входа')
        throw error
      } finally {
        this.isChecking = false
      }
    },

    /**
     * Выход из системы
     */
    async logout() {
      const notifications = useNotifications()
      try {
        const tokenCookie = useCookie('auth_token')
        const sessionIdCookie = useCookie('session_id')
        const token = tokenCookie.value

        if (token) {
          // ✅ Завершаем сессию на сервере
          // 💡 Используем $fetch напрямую, чтобы избежать потенциальной рекурсии 401 → logout → useApi
          await $fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          })
        }

        // Удаляем куки
        tokenCookie.value = null
        sessionIdCookie.value = null

        // Сбрасываем состояние
        this.resetState()

        notifications.info('Вы вышли из системы')

        const router = useRouter()
        router.push('/login')
      } catch (error) {
        console.error('[AuthStore] Ошибка при выходе:', error)
        notifications.error('Ошибка при выходе из системы')

        // Даже при ошибке удаляем токен и перенаправляем
        useCookie('auth_token').value = null
        useCookie('session_id').value = null
        this.resetState()

        useRouter().push('/login')
      }
    },

    /**
     * Сброс состояния аутентификации
     */
    resetState() {
      this.token = null
      this.user = null
      this.sessionId = null      // ✅ Добавлено
      this.isAuthenticated = false
      this.isChecking = false    // ✅ Добавлено
      this.error = null
    }
  },

  /**
   * Синхронизация с куками (вызывается при SSR/гидратации)
   */
  hydrate(state: AuthState) {
    const tokenCookie = useCookie('auth_token')
    const rawCookie = tokenCookie.value

    if (!rawCookie) {
      state.token = null
      state.isAuthenticated = false
      state.isChecking = false
      return
    }

    try {
      // ✅ Парсим новый JSON-формат куки
      const payload: AuthCookiePayload = JSON.parse(rawCookie)

      // Восстанавливаем токен и минимальные данные пользователя
      state.token = payload.token
      state.user = { id: payload.userId, role: payload.role } as User
      state.isAuthenticated = true // Оптимистично считаем авторизованным
      state.isChecking = true      // Запускаем фоновую проверку
    } catch (error) {
      console.log('[AuthStore] Ошибка парсинга куки авторизации, сбрасываем состояние')
      state.token = null
      state.isAuthenticated = false
      state.isChecking = false
    }
  }
})
