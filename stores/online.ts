// stores/online.ts
import { defineStore } from 'pinia'
import { useSocketStore } from './socket'
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
    getOnlineUsers: (state) => state.users,
    getOnlineCount: (state) => state.users.length,
    getActiveUsers: (state) => state.users.filter(u => u.status === 'online'),
    getAFKUsers: (state) => state.users.filter(u => u.status === 'afk'),
    isLoadingUsers: (state) => state.isLoading,
    hasError: (state) => !!state.error
  },
  
  actions: {
    /**
     * Загрузка списка онлайн-пользователей
     */
    async fetchOnlineUsers() {
      this.isLoading = true
      this.error = null
      try {
        const response = await $fetch<{ users: OnlineUser[] }>('/api/online')
        this.users = response.users || []
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
      this.users = users || []
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
