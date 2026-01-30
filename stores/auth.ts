// stores/auth.ts
import { defineStore } from 'pinia'
import { useCookie, useRouter } from 'nuxt/app'
import { useSocketStore } from './socket'
import type { User } from '~/types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isChecking: boolean
  error: string | null
}

// Интерфейс для ответа сервера
interface AuthResponse {
  token: string
  user: User
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: useCookie('auth_token').value || null,
    user: null,
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
    // stores/auth.ts
    async init() {
      try {
        this.isChecking = true
        this.error = null
        
        // Проверяем, есть ли токен в куках
        const token = useCookie('auth_token').value
        if (!token) {
          this.resetState()
          return
        }
        
        // Проверяем токен на сервере
        const { user } = await $fetch<AuthResponse>('/api/auth/check', {
          method: 'GET',
          credentials: 'include' // Это ключевое изменение!
        })
        
        // Устанавливаем данные пользователя
        this.token = token
        this.user = user
        this.isAuthenticated = true
        
        // Инициируем подключение сокета
        try {
          const socketStore = useSocketStore()
          if (typeof socketStore.connect === 'function') {
            await socketStore.connect()
          }
        } catch (socketError) {
          console.error('Socket connection failed during init:', socketError)
        }
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
          sameSite: 'lax', // Важно для HTTP
          secure: process.env.NODE_ENV === 'production'
        })
        tokenCookie.value = response.token
        
        // Обновляем состояние
        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true
        
        // Подключаем сокет с новым токеном
        await this.connectSocket()

        // перенаправление на кабинет
        const router = useRouter()
        router.push('/cabinet')
        
        return response
      } catch (error: any) {
        console.error('Login failed:', error)
        this.error = error.message || 'Authentication failed'
        throw error
      } finally {
        this.isChecking = false
      }
    },
    
    /**
     * Выход из системы
     */
    async logout() {
      try {
        // Удаляем токен из кук с указанием пути
        const tokenCookie = useCookie('auth_token', { path: '/' })
        tokenCookie.value = null
        
        // Отключаем сокет
        const socketStore = useSocketStore()
        await socketStore.disconnect()
        
        // Сбрасываем состояние
        this.resetState()
      } catch (error) {
        console.error('Logout failed:', error)
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
    },
    
    /**
     * Подключение сокета с текущим токеном
     */
    async connectSocket() {
      try {
        const socketStore = useSocketStore()
        
        // Если сокет уже подключен, переподключаемся
        if (socketStore.isConnected) {
          await socketStore.reconnect()
        } else {
          await socketStore.connect()
        }
      } catch (error) {
        console.error('Socket connection failed:', error)
        this.error = 'Failed to connect to real-time service'
      }
    }
  },
  
  /**
   * Синхронизация с куками
   */
  hydrate(state) {
    const tokenCookie = useCookie('auth_token')
    state.token = tokenCookie.value || null
  }
})
