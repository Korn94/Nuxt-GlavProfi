// stores/auth/index.ts
import { defineStore } from 'pinia'
import { useCookie, useRouter } from 'nuxt/app'
import { useNotifications } from '~/composables/useNotifications'
import { useApi } from '~/composables/useApi'
import { clearCurrentUser } from '~/composables/useCurrentUser'
import type { User } from '~/types'
import type { Role, PageSlug, PagePermissions, UserPermissionsResponse } from '~/types/permissions'

interface AuthState {
  token: string | null
  user: User | null
  sessionId: string | null
  isAuthenticated: boolean
  isChecking: boolean
  error: string | null
  pages: Record<PageSlug, PagePermissions> | null  // ← НОВАЯ СИСТЕМА (вместо permissions)
  roleLevel: number | null
}

interface AuthResponse {
  token: string
  user: User
  sessionId: string
}

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
    token: null,
    user: null,
    sessionId: null,
    isAuthenticated: false,
    isChecking: true,
    error: null,
    pages: null,  // ← НОВАЯ СИСТЕМА (вместо permissions)
    roleLevel: null
  }),

  getters: {
    getToken: (state) => state.token,
    getUser: (state) => state.user,
    getIsAuthenticated: (state) => state.isAuthenticated,
    getIsChecking: (state) => state.isChecking,
    getError: (state) => state.error,
  },

  actions: {
    /**
     * Инициализация сессии (вызывается при SSR/гидратации и F5)
     */
    async init(): Promise<void> {
      try {
        // ✅ Guard: если уже загружено — не делаем повторных запросов
        if (this.user && this.pages && !this.isChecking) {
          console.log('[AuthStore] ⏭️ Данные уже загружены, пропускаем init()')
          return
        }

        this.isChecking = true
        this.error = null

        if (!this.token) {
          this.resetState()
          return
        }

        const api = useApi()
        const [userRes, permsRes] = await Promise.all([
          api.get<{ user: User }>('/api/auth/check'),
          api.get<UserPermissionsResponse>('/api/permissions')
        ])

        this.user = userRes.user
        this.pages = permsRes.pages
        this.roleLevel = permsRes.level
        this.isAuthenticated = true

        console.log('[AuthStore] ✅ Данные загружены:', {
          user: this.user.name,
          role: this.user.role,
          pagesCount: Object.keys(this.pages).length
        })
      } catch (error) {
        console.error('[AuthStore] Ошибка проверки авторизации:', error)
        this.resetState()
        if (process.client) {
          const { navigateTo } = await import('#app')
          navigateTo('/login')
        }
      } finally {
        if (process.client) {
          import('vue').then(({ nextTick }) => {
            nextTick(() => {
              this.isChecking = false
            })
          })
        } else {
          this.isChecking = false
        }
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

        if ('telegramData' in credentials) {
          response = await api.post<AuthResponse>('/api/auth/telegram', credentials.telegramData)
        } else {
          response = await api.post<AuthResponse>('/api/auth/login', credentials)
        }

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

        const sessionIdCookie = useCookie('session_id', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        })
        sessionIdCookie.value = response.sessionId

        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true
        this.sessionId = response.sessionId

        // ✅ После логина нужно загрузить права
        // Делаем дополнительный запрос к /api/permissions
        try {
          const permsRes = await api.get<UserPermissionsResponse>('/api/permissions')
          this.pages = permsRes.pages
          this.roleLevel = permsRes.level
        } catch (permError) {
          console.warn('[AuthStore] Не удалось загрузить права после логина:', permError)
          this.pages = null
          this.roleLevel = null
        }

        // ✅ Сбрасываем кэш текущего пользователя
        clearCurrentUser()

        notifications.success(`Добро пожаловать, ${response.user.name}!`)

        if (process.client) {
          await this.connectSocket(response.token)
        }

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
     * Подключение к сокету после успешной авторизации
     */
    async connectSocket(token: string) {
      if (!process.client) return

      try {
        const { socketService } = await import('services/socket.service')
        socketService.init()
        socketService.connect(token)

        console.log('[AuthStore] 🟡 Сокет подключён после логина')
      } catch (error) {
        console.error('[AuthStore] ❌ Ошибка подключения сокета:', error)
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

        // Пытаемся сообщить серверу о выходе
        if (tokenCookie.value) {
          await $fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          }).catch(() => {})
        }

        // Отключаем сокет перед сбросом состояния
        if (process.client) {
          try {
            const { socketService } = await import('services/socket.service')
            socketService.disconnect()
            console.log('[AuthStore] 🔌 Сокет отключён')
          } catch (e) {
            console.error('[AuthStore] Ошибка отключения сокета:', e)
          }
        }

        tokenCookie.value = null
        sessionIdCookie.value = null

        // ✅ Сбрасываем кэш текущего пользователя
        clearCurrentUser()

        this.resetState()

        notifications.info('Вы вышли из системы')

        const router = useRouter()
        router.push('/login')
      } catch (error) {
        console.error('[AuthStore] Ошибка при выходе:', error)
        notifications.error('Ошибка при выходе из системы')

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
      this.sessionId = null
      this.isAuthenticated = false
      this.isChecking = false
      this.error = null
      this.pages = null       // ← НОВАЯ СИСТЕМА (было: this.permissions = null)
      this.roleLevel = null
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
      state.isChecking = true
      return
    }
    
    try {
      const payload: AuthCookiePayload = JSON.parse(rawCookie)
      state.token = payload.token
      state.user = { 
        id: payload.userId, 
        role: payload.role,
        name: ''
      } as User
      state.isAuthenticated = true
      state.isChecking = true
    } catch (error) {
      console.log('[AuthStore] Ошибка парсинга куки')
      state.token = null
      state.isAuthenticated = false
      state.isChecking = true
    }
  }
})
