// stores/auth/index.ts
import { defineStore } from 'pinia'
import { useCookie, useRouter } from 'nuxt/app'
import { useNotifications } from '~/composables/useNotifications'
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

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: useCookie('auth_token').value || null,
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
        
        const token = useCookie('auth_token').value
        if (!token) {
          this.resetState()
          return
        }
        
        // Проверяем токен на сервере
        const { user } = await $fetch<{ user: any }>('/api/auth/check', {
          method: 'GET',
          credentials: 'include'
        })
        
        // Устанавливаем данные пользователя
        this.token = token
        this.user = user
        this.isAuthenticated = true
        
        // ✅ Сокет подключается автоматически через watch в plugins/socket.client.ts
        
      } catch (error) {
        console.error('Authentication check failed:', error)
        this.resetState()
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
        
        // Определяем тип аутентификации
        if ('telegramData' in credentials) {
          response = await $fetch<AuthResponse>('/api/auth/telegram', {
            method: 'POST',
            body: credentials.telegramData
          })
        } else {
          response = await $fetch<AuthResponse>('/api/auth/login', {
            method: 'POST',
            body: credentials
          })
        }
        
        // Сохраняем токен в куки
        const tokenCookie = useCookie('auth_token', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
        tokenCookie.value = response.token
        
        // Сохраняем sessionId в куки
        const sessionIdCookie = useCookie('session_id', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
        sessionIdCookie.value = response.sessionId
        
        // Обновляем состояние
        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true  // ✅ watch в плагине сработает и подключит сокет
        this.sessionId = response.sessionId
        
        // Показываем уведомление об успешном входе
        notifications.success(`Добро пожаловать, ${response.user.name}!`)
        
        // Перенаправление на кабинет
        const router = useRouter()
        router.push('/cabinet')
        
        return response
      } catch (error: any) {
        console.error('Login failed:', error)
        
        let errorMessage = 'Ошибка авторизации'
        if (error.data?.message) {
          errorMessage = error.data.message
        } else if (error.message) {
          errorMessage = error.message
        }
        
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
          // Завершаем сессию на сервере
          await $fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          })
        }
        
        // Удаляем куки
        tokenCookie.value = null
        sessionIdCookie.value = null
        
        // ✅ Сокет отключается автоматически через watch в plugins/socket.client.ts
        
        // Сбрасываем состояние
        this.resetState()
        
        notifications.info('Вы вышли из системы')
        
        const router = useRouter()
        router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
        notifications.error('Ошибка при выходе из системы')
        
        // Даже при ошибке удаляем токен и перенаправляем
        const tokenCookie = useCookie('auth_token')
        const sessionIdCookie = useCookie('session_id')
        tokenCookie.value = null
        sessionIdCookie.value = null
        this.resetState()
        
        const router = useRouter()
        router.push('/login')
      }
    },
    
    /**
     * Сброс состояния аутентификации
     */
    resetState() {
      this.token = null
      this.user = null
      this.isAuthenticated = false
      this.error = null
    }
  },
  
  /**
   * Синхронизация с куками
   */
  hydrate(state: AuthState) {
    const tokenCookie = useCookie('auth_token')
    state.token = tokenCookie.value || null
  }
})
