// stores/online.ts
import { defineStore } from 'pinia'
import { useSocketStore } from '../stores/socket'
import type { OnlineUser } from '~/types'

interface OnlineState {
  users: OnlineUser[]
  isLoading: boolean
  error: string | null
}

export const useOnlineStore = defineStore('online', {
  state: (): OnlineState => ({
    users: [],
    isLoading: false,
    error: null
  }),

  getters: {
    // ✅ Основные геттеры
    getOnlineUsers: (state) => state.users,
    getOnlineCount: (state) => state.users.length,
    
    // ✅ Фильтрация по статусу
    getActiveUsers: (state) => state.users.filter(u => u.status === 'online'),
    getAFKUsers: (state) => state.users.filter(u => u.status === 'afk'),
    
    // ✅ Статистика по вкладкам
    getTotalTabsCount: (state) => state.users.reduce((sum, user) => sum + user.tabsCount, 0),
    
    // ✅ Статус загрузки и ошибок
    isLoadingUsers: (state) => state.isLoading,
    hasError: (state) => !!state.error,
    
    // ✅ Сортировка по количеству вкладок
    getUsersByTabsDesc: (state) => [...state.users].sort((a, b) => b.tabsCount - a.tabsCount),
    getUsersByTabsAsc: (state) => [...state.users].sort((a, b) => a.tabsCount - b.tabsCount),
    
    // ✅ Фильтрация по роли
    getAdmins: (state) => state.users.filter(u => u.user.role === 'admin'),
    getManagers: (state) => state.users.filter(u => u.user.role === 'manager'),
    getForemans: (state) => state.users.filter(u => u.user.role === 'foreman'),
    getWorkers: (state) => state.users.filter(u => u.user.role === 'worker')
  },

  actions: {
    /**
     * Загрузка списка онлайн-пользователей
     */
    async fetchOnlineUsers() {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await $fetch<{ 
          users: OnlineUser[], 
          total: number, 
          online: number, 
          afk: number 
        }>('/api/online')
        
        this.users = response.users || []
        console.log(`[OnlineStore] Loaded ${this.users.length} online users`)
      } catch (error) {
        console.error('Error fetching online users:', error)
        this.error = 'Не удалось загрузить список онлайн-пользователей'
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Обновление списка пользователей
     */
    updateUsers(users: OnlineUser[]) {
      // console.log('[OnlineStore] Updating users via socket:', users.length)
      this.users = [...users]
    },

    /**
     * Получение пользователя по ID
     */
    getUserById(userId: number) {
      return this.users.find(user => user.userId === userId)
    },

    /**
     * Подписка на обновления через сокеты
     */
    subscribeToUpdates() {
      const socketStore = useSocketStore()
      
      // ✅ Проверяем, что сокет подключен
      if (!socketStore.isConnected) {
        console.warn('[OnlineStore] Socket not connected, retrying...')
        setTimeout(() => this.subscribeToUpdates(), 1000)
        return
      }
      
      console.log('[OnlineStore] Subscribing to socket updates...')
      
      socketStore.on('online-users:update', (users: OnlineUser[]) => {
        // console.log('[OnlineStore] Received socket update:', users)
        this.updateUsers(users)
      })
      
      console.log('[OnlineStore] Subscribed to socket updates')
    },

    /**
     * Отписка от обновлений
     */
    unsubscribeFromUpdates() {
      const socketStore = useSocketStore()
      socketStore.off('online-users:update')
      console.log('[OnlineStore] Unsubscribed from socket updates')
    },

    /**
     * Очистка состояния
     */
    clear() {
      this.users = []
      this.error = null
    }
  }
})
