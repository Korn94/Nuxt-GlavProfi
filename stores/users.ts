// stores/users.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: number
  login: string
  name: string
  role: 'admin' | 'manager' | 'foreman' | 'master' | 'worker'
  telegramId?: number | null
  createdAt?: string
  updatedAt?: string
}

interface UsersState {
  users: User[]
  loading: boolean
  error: string | null
  lastFetch: number | null
}

export const useUsersStore = defineStore('users', () => {
  // ============================================
  // STATE
  // ============================================
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastFetch = ref<number | null>(null)

  // Кэш: 5 минут
  const CACHE_TTL = 5 * 60 * 1000

  // ============================================
  // GETTERS
  // ============================================
  const allUsers = computed(() => users.value)

  const getUserById = (id: number) => {
    return computed(() => users.value.find(u => u.id === id) || null)
  }

  const getUsersByRole = (role: string) => {
    return computed(() => users.value.filter(u => u.role === role))
  }

  const isCacheValid = computed(() => {
    if (!lastFetch.value) return false
    return Date.now() - lastFetch.value < CACHE_TTL
  })

  // ============================================
  // ACTIONS
  // ============================================
  
  /**
   * Загрузка всех пользователей с кэшированием
   */
  async function fetchUsers(force = false) {
    // Если данные в кэше и не форсируем обновление — возвращаем кэш
    if (!force && isCacheValid.value && users.value.length > 0) {
      console.log('[UsersStore] Using cached users')
      return users.value
    }

    loading.value = true
    error.value = null

    try {
      console.log('[UsersStore] Fetching users from API...')
      
      const response = await $fetch<{ users: User[] }>('/api/users/get', {
        method: 'GET',
        credentials: 'include'
      })

      users.value = response.users || []
      lastFetch.value = Date.now()
      
      console.log(`[UsersStore] Loaded ${users.value.length} users`)
      return users.value
    } catch (err: any) {
      console.error('[UsersStore] Failed to fetch users:', err)
      error.value = err.data?.message || 'Не удалось загрузить список пользователей'
      
      // Не выбрасываем ошибку, чтобы не ломать UI
      return users.value
    } finally {
      loading.value = false
    }
  }

  /**
   * Загрузка конкретного пользователя по ID
   */
  async function fetchUserById(id: number): Promise<User | null> {
    // Сначала проверяем кэш
    const cached = users.value.find(u => u.id === id)
    if (cached) {
      return cached
    }

    try {
      const user = await $fetch<User>(`/api/users/${id}/get`, {
        method: 'GET',
        credentials: 'include'
      })

      // Добавляем в кэш если ещё нет
      const existingIndex = users.value.findIndex(u => u.id === id)
      if (existingIndex === -1) {
        users.value.push(user)
      } else {
        users.value[existingIndex] = user
      }

      return user
    } catch (err: any) {
      console.error(`[UsersStore] Failed to fetch user ${id}:`, err)
      return null
    }
  }

  /**
   * Получение пользователя с авто-загрузкой если нет в кэше
   */
  async function getUserWithFetch(id: number): Promise<User | null> {
    const cached = users.value.find(u => u.id === id)
    if (cached) return cached

    return await fetchUserById(id)
  }

  /**
   * Обновление данных пользователя в кэше
   */
  function updateUserInCache(user: User) {
    const index = users.value.findIndex(u => u.id === user.id)
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...user }
    } else {
      users.value.push(user)
    }
  }

  /**
   * Очистка кэша
   */
  function clearCache() {
    users.value = []
    lastFetch.value = null
    error.value = null
  }

  /**
   * Инициализация стора (авто-загрузка при первом использовании)
   */
  async function init() {
    if (users.value.length === 0) {
      await fetchUsers()
    }
  }

  // ============================================
  // RETURN
  // ============================================
  return {
    // State
    users,
    loading,
    error,
    lastFetch,

    // Getters
    allUsers,
    getUserById,
    getUsersByRole,
    isCacheValid,

    // Actions
    fetchUsers,
    fetchUserById,
    getUserWithFetch,
    updateUserInCache,
    clearCache,
    init
  }
})
