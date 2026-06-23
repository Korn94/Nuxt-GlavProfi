// stores/auth/index.ts
/**
 * 🔐 Auth Store — управление авторизацией и правами пользователя
 *
 * Архитектура:
 * - Хранит токен, пользователя и права (pages)
 * - Cookie содержит ТОЛЬКО JWT (без userId/role)
 * - Права получаем либо в login-ответе, либо отдельным запросом (init)
 *
 * Модель прав (без canView):
 * - Раздел виден в меню, если есть хотя бы одно действие (create/edit/delete/special)
 * - View-only страницы (dashboard, online, test) видимы по факту наличия в pages
 * - Видимость вычисляется в usePermissions composable, не в store
 *
 * Обратная совместимость:
 * - Парсер cookie поддерживает старый JSON-формат {token, userId, role}
 * - Постепенно все cookie перейдут на plain JWT
 */

import { defineStore } from 'pinia'
import { useCookie, useRouter } from 'nuxt/app'
import { useNotifications } from '~/composables/useNotifications'
import { useApi } from '~/composables/useApi'
import { clearCurrentUser } from '~/composables/useCurrentUser'
import type { User } from '~/types'

import { ROLE_LEVELS, type Role } from 'shared/constants/roles'
import type { PageSlug } from 'shared/constants/permissions'
import type { PagePermissions, UserPermissionsResponse } from 'shared/types/permissions'

// ============================================
// ИНТЕРФЕЙСЫ
// ============================================

interface AuthState {
  token: string | null
  user: User | null
  sessionId: string | null
  isAuthenticated: boolean
  isChecking: boolean
  error: string | null
  /** Права пользователя: Record<PageSlug, PagePermissions> (с canView для Read-Only) */
  pages: Record<PageSlug, PagePermissions> | null
  roleLevel: number | null
  /** Флаг: первичная инициализация уже выполнена */
  initialized: boolean
}

/**
 * Ответ сервера на /api/auth/login и /api/auth/telegram
 *
 * `permissions` — опциональное поле. Если сервер его возвращает —
 * используем сразу (нет race condition). Если нет — fallback на отдельный запрос.
 */
interface AuthResponse {
  token: string
  user: User
  sessionId: string
  permissions?: UserPermissionsResponse
}

// ============================================
// ХЕЛПЕРЫ РАБОТЫ С COOKIE
// ============================================

/**
 * Извлечь JWT из cookie.
 * Поддерживает два формата:
 * - Новый: plain строка JWT
 * - Старый (обратная совместимость): JSON { token, userId, role }
 */
function extractTokenFromCookie(raw: string | null | undefined): string | null {
  if (!raw) return null

  // Если это похоже на JSON — пробуем распарсить (старый формат)
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      return parsed.token || null
    } catch {
      return null
    }
  }

  // Новый формат: plain JWT. Валидируем минимальную длину.
  return raw.length > 20 ? raw : null
}

// ============================================
// STORE
// ============================================

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
    sessionId: null,
    isAuthenticated: false,
    isChecking: true,
    error: null,
    pages: null,
    roleLevel: null,
    initialized: false,
  }),

  getters: {
    // ============================================
    // БАЗОВЫЕ GETTERS
    // ============================================

    getToken: (state) => state.token,
    getUser: (state) => state.user,
    getIsAuthenticated: (state) => state.isAuthenticated,
    getIsChecking: (state) => state.isChecking,
    getError: (state) => state.error,

    /**
     * Текущая роль пользователя (типобезопасно)
     */
    currentRole(): Role | null {
      return (this.user?.role as Role) ?? null
    },

    /**
     * Права на конкретную страницу (shortcut)
     */
    getPagePermissions() {
      return (page: PageSlug): PagePermissions | null => {
        return this.pages?.[page] ?? null
      }
    },

    /**
     * Есть ли страница в правах (означает что она видима)
     *
     * В новой модели (без canView) страница есть в pages только если она видима.
     * Серверный getAllUserPermissions() уже отфильтровал невидимые.
     */
    hasPage() {
      return (page: PageSlug): boolean => {
        return !!this.pages && page in this.pages
      }
    },
  },

  actions: {
    // ============================================
    // ИНИЦИАЛИЗАЦИЯ (SSR / гидратация / F5)
    // ============================================

    /**
     * Инициализация сессии при загрузке приложения.
     * Делает два параллельных запроса:
     * - /api/auth/check — получить пользователя
     * - /api/permissions — получить права
     *
     * Это нормально для init, т.к. вызывается один раз при загрузке.
     * Race condition был в login() — там мы его убрали.
     */
    async init(): Promise<void> {
      try {
        // Guard: если уже загружено — не делаем повторных запросов
        if (this.user && this.pages && !this.isChecking) {
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
          api.get<UserPermissionsResponse>('/api/permissions'),
        ])

        this.user = userRes.user
        this.pages = permsRes.pages as Record<PageSlug, PagePermissions>
        this.roleLevel = permsRes.level
        this.isAuthenticated = true
        this.initialized = true
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

    // ============================================
    // ЛОГИН
    // ============================================

    /**
     * Аутентификация пользователя (логин или Telegram).
     *
     * Улучшения:
     * - Cookie хранит ТОЛЬКО JWT (без JSON-обёртки)
     * - Permissions берутся из login-ответа (нет race condition)
     * - Fallback: если сервер не вернул permissions — запрашиваем отдельно
     */
    async login(credentials: { login: string; password: string } | { telegramData: any }) {
      const notifications = useNotifications()

      try {
        this.error = null
        this.isChecking = true

        const api = useApi()
        let response: AuthResponse

        if ('telegramData' in credentials) {
          response = await api.post<AuthResponse>('/api/auth/telegram', credentials.telegramData)
        } else {
          response = await api.post<AuthResponse>('/api/auth/login', credentials)
        }

        // ✅ Сохраняем ТОЛЬКО JWT в cookie (без JSON-обёртки)
        const tokenCookie = useCookie('auth_token', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        tokenCookie.value = response.token

        const sessionIdCookie = useCookie('session_id', {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
        sessionIdCookie.value = response.sessionId

        // Обновляем state
        this.token = response.token
        this.user = response.user
        this.isAuthenticated = true
        this.sessionId = response.sessionId

        // ✅ Permissions из login-ответа (если сервер их вернул)
        // ⚠️ Новая модель (без canView) — в pages только видимые страницы
        if (response.permissions) {
          this.pages = response.permissions.pages as Record<PageSlug, PagePermissions>
          this.roleLevel = response.permissions.level
        } else {
          // Fallback: сервер ещё не обновлён — запрашиваем отдельно
          try {
            const permsRes = await api.get<UserPermissionsResponse>('/api/permissions')
            this.pages = permsRes.pages as Record<PageSlug, PagePermissions>
            this.roleLevel = permsRes.level
          } catch (permError) {
            console.warn('[AuthStore] Не удалось загрузить права после логина:', permError)
            this.pages = null
            this.roleLevel = null
          }
        }

        this.initialized = true

        // Сбрасываем кэш useCurrentUser
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

    // ============================================
    // СОКЕТ
    // ============================================

    /**
     * Подключение к сокету после успешной авторизации
     */
    async connectSocket(token: string) {
      if (!process.client) return
      try {
        const { socketService } = await import('services/socket.service')
        socketService.init()
        socketService.connect(token)
      } catch (error) {
        console.error('[AuthStore] ❌ Ошибка подключения сокета:', error)
      }
    },

    // ============================================
    // ВЫХОД
    // ============================================

    /**
     * Выход из системы.
     * Очищает cookie, отключает сокет, сбрасывает state.
     */
    async logout() {
      const notifications = useNotifications()

      try {
        const tokenCookie = useCookie('auth_token')
        const sessionIdCookie = useCookie('session_id')

        // Сообщаем серверу о выходе
        if (tokenCookie.value) {
          await $fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          }).catch(() => {})
        }

        // Отключаем сокет
        if (process.client) {
          try {
            const { socketService } = await import('services/socket.service')
            socketService.disconnect()
          } catch (e) {
            console.error('[AuthStore] Ошибка отключения сокета:', e)
          }
        }

        // Очищаем cookie (просто null, без JSON)
        tokenCookie.value = null
        sessionIdCookie.value = null

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

    // ============================================
    // 🆕 ПРИНУДИТЕЛЬНЫЙ ВЫХОД (от сервера через сокет)
    // ============================================

    /**
     * Принудительный выход: сервер потребовал перелогиниться.
     *
     * Используется когда:
     * - Админ отозвал права на критические страницы (dashboard/objects/works)
     * - Роль пользователя была сброшена к дефолтам
     * - Права роли были существенно изменены (копирование/сброс)
     *
     * В отличие от logout() — НЕ уведомляет сервер (он сам инициировал)
     * и НЕ отключает сокет (соединение уже разорвано сервером).
     *
     * @param reason — причина отключения (показывается пользователю)
     */
    async forceLogout(reason?: string) {
      const notifications = useNotifications()

      console.warn(
        `[AuthStore] ⚠️ Принудительный выход: ${reason || 'причина не указана'}`
      )

      // Показываем уведомление с причиной
      if (reason) {
        notifications.warning(reason, 'Сессия завершена')
      } else {
        notifications.warning(
          'Ваши права доступа были изменены. Необходимо войти заново.',
          'Сессия завершена'
        )
      }

      // Очищаем cookie (сервер уже знает о разрыве)
      useCookie('auth_token').value = null
      useCookie('session_id').value = null

      clearCurrentUser()
      this.resetState()

      // Перенаправляем на логин
      if (process.client) {
        const router = useRouter()
        router.push('/login')
      }
    },

    // ============================================
    // 🆕 ПЕРЕЗАГРУЗКА ПРАВ (без полного reinit)
    // ============================================

    /**
     * Перезагрузить только права доступа (без повторной проверки авторизации).
     *
     * Используется когда:
     * - Другой админ изменил права текущей роли
     * - Текущему пользователю добавили/убрали override
     * - Получено сокет-событие 'permissions:changed'
     *
     * При ошибке — разлогиниваем (возможно, отозвали доступ полностью).
     */
    async reloadPermissions(): Promise<void> {
      if (!this.user || !this.token) return

      try {
        const api = useApi()
        const permsRes = await api.get<UserPermissionsResponse>('/api/permissions')

        this.pages = permsRes.pages as Record<PageSlug, PagePermissions>
        this.roleLevel = permsRes.level

        console.log('[AuthStore] 🔄 Права перезагружены')
      } catch (error) {
        console.error('[AuthStore] Ошибка перезагрузки прав:', error)
        // При ошибке — разлогиниваем (возможно, отозвали доступ)
        await this.forceLogout('Не удалось загрузить права доступа. Сессия завершена.')
      }
    },

    // ============================================
    // СБРОС СОСТОЯНИЯ
    // ============================================

    resetState() {
      this.token = null
      this.user = null
      this.sessionId = null
      this.isAuthenticated = false
      this.isChecking = false
      this.error = null
      this.pages = null
      this.roleLevel = null
      this.initialized = false
    },
  },

  // ============================================
  // ГИДРАТАЦИЯ (SSR → Client)
  // ============================================

  /**
   * Синхронизация с cookie при гидратации.
   * Поддерживает новый (plain JWT) и старый (JSON) форматы cookie.
   */
  hydrate(state: AuthState) {
    const tokenCookie = useCookie('auth_token')
    const token = extractTokenFromCookie(tokenCookie.value)

    if (!token) {
      state.token = null
      state.user = null
      state.sessionId = null
      state.isAuthenticated = false
      state.isChecking = false // ✅ НЕТ токена = нечего проверять
      state.error = null
      state.pages = null
      state.roleLevel = null
      state.initialized = false
      return
    }

    state.token = token
    state.isAuthenticated = true
    state.isChecking = true // Токен есть → нужна проверка через init()
  },
})
