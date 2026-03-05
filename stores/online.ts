// stores/online.ts
/**
 * Store для управления списком онлайн-пользователей
 * 
 * Архитектура:
 * - Хранение списка пользователей с их статусами и вкладками
 * - Подписка на real-time обновления через SocketService
 * - Фильтрация и сортировка пользователей
 * - Статистика по онлайн-активности
 */

import { defineStore } from 'pinia'
import { socketService } from 'services/socket.service' // ✅ Импортируем SocketService
import type { OnlineUser } from '~/types'

/**
 * Интерфейс состояния store
 */
interface OnlineState {
  /**
   * Список онлайн-пользователей
   */
  users: OnlineUser[]
  
  /**
   * Флаг загрузки данных
   */
  isLoading: boolean
  
  /**
   * Сообщение об ошибке
   */
  error: string | null
  
  /**
   * Флаг активной подписки на сокет-события
   */
  isSubscribed: boolean
}

export const useOnlineStore = defineStore('online', {
  // ============================================
  // STATE
  // ============================================
  
  state: (): OnlineState => ({
    users: [],
    isLoading: false,
    error: null,
    isSubscribed: false // ✅ Отслеживаем состояние подписки
  }),

  // ============================================
  // GETTERS
  // ============================================
  
  getters: {
    // ✅ Основные геттеры
    /**
     * Получить всех онлайн-пользователей
     */
    getOnlineUsers: (state): OnlineUser[] => state.users,
    
    /**
     * Получить общее количество онлайн-пользователей
     */
    getOnlineCount: (state): number => state.users.length,
    
    // ✅ Фильтрация по статусу
    /**
     * Получить активных пользователей (статус: online)
     */
    getActiveUsers: (state): OnlineUser[] => 
      state.users.filter(u => u.status === 'online'),
    
    /**
     * Получить пользователей в AFK (статус: afk)
     */
    getAFKUsers: (state): OnlineUser[] => 
      state.users.filter(u => u.status === 'afk'),
    
    // ✅ Статистика по вкладкам
    /**
     * Получить общее количество открытых вкладок у всех пользователей
     */
    getTotalTabsCount: (state): number => 
      state.users.reduce((sum, user) => sum + (user.tabsCount || 0), 0),
    
    // ✅ Статус загрузки и ошибок
    /**
     * Проверка, идёт ли загрузка данных
     */
    isLoadingUsers: (state): boolean => state.isLoading,
    
    /**
     * Проверка наличия ошибки
     */
    hasError: (state): boolean => !!state.error,
    
    // ✅ Сортировка по количеству вкладок
    /**
     * Получить пользователей, отсортированных по убыванию вкладок
     */
    getUsersByTabsDesc: (state): OnlineUser[] => 
      [...state.users].sort((a, b) => (b.tabsCount || 0) - (a.tabsCount || 0)),
    
    /**
     * Получить пользователей, отсортированных по возрастанию вкладок
     */
    getUsersByTabsAsc: (state): OnlineUser[] => 
      [...state.users].sort((a, b) => (a.tabsCount || 0) - (b.tabsCount || 0)),
    
    // ✅ Фильтрация по роли
    /**
     * Получить администраторов
     */
    getAdmins: (state): OnlineUser[] => 
      state.users.filter(u => u.user?.role === 'admin'),
    
    /**
     * Получить менеджеров
     */
    getManagers: (state): OnlineUser[] => 
      state.users.filter(u => u.user?.role === 'manager'),
    
    /**
     * Получить прорабов
     */
    getForemans: (state): OnlineUser[] => 
      state.users.filter(u => u.user?.role === 'foreman'),
    
    /**
     * Получить рабочих
     */
    getWorkers: (state): OnlineUser[] => 
      state.users.filter(u => u.user?.role === 'worker')
  },

  // ============================================
  // ACTIONS
  // ============================================
  
  actions: {
    /**
     * Загрузка списка онлайн-пользователей с API
     */
    async fetchOnlineUsers() {
      this.isLoading = true
      this.error = null
      
      try {
        console.log('[OnlineStore] 📥 Загрузка списка онлайн-пользователей...')
        
        const response = await $fetch<{ 
          users: OnlineUser[], 
          total: number, 
          online: number, 
          afk: number 
        }>('/api/online')
        
        this.users = response.users || []
        console.log(`[OnlineStore] ✅ Загружено ${this.users.length} онлайн-пользователей`)
        
        return this.users
      } catch (error: any) {
        console.error('[OnlineStore] ❌ Ошибка загрузки онлайн-пользователей:', error)
        this.error = error.data?.message || 'Не удалось загрузить список онлайн-пользователей'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    /**
     * Обновление списка пользователей (вызывается из socket-событий)
     * @param users - Новый список пользователей
     */
    updateUsers(users: OnlineUser[]) {
      console.log(`[OnlineStore] 🔄 Обновление списка: ${users.length} пользователей`)
      this.users = [...users]
    },

    /**
     * Получение пользователя по ID
     * @param userId - ID пользователя
     * @returns Онлайн-пользователь или undefined
     */
    getUserById(userId: number): OnlineUser | undefined {
      return this.users.find(user => user.userId === userId)
    },

    /**
     * Подписка на real-time обновления через SocketService
     */
    subscribeToUpdates() {
      // ✅ Проверяем, чтобы не подписываться дважды
      if (this.isSubscribed) {
        console.log('[OnlineStore] ⚠️ Уже подписано на обновления')
        return
      }
      
      console.log('[OnlineStore] 🔔 Подписка на socket-обновления...')
      
      try {
        // ✅ ИСПРАВЛЕНО: Используем socketService вместо socketStore
        socketService.on('online-users:update', (users: OnlineUser[]) => {
          console.log(`[OnlineStore] 📡 Получено обновление: ${users?.length || 0} пользователей`)
          this.updateUsers(users)
        })
        
        // ✅ Отслеживаем статус подписки
        this.isSubscribed = true
        console.log('[OnlineStore] ✅ Подписка активна')
      } catch (error) {
        console.error('[OnlineStore] ❌ Ошибка подписки на обновления:', error)
        this.error = 'Не удалось подписаться на обновления'
      }
    },

    /**
     * Отписка от real-time обновлений
     */
    unsubscribeFromUpdates() {
      if (!this.isSubscribed) {
        console.log('[OnlineStore] ⚠️ Уже отписано от обновлений')
        return
      }
      
      console.log('[OnlineStore] 📴 Отписка от socket-обновлений...')
      
      try {
        // ✅ ИСПРАВЛЕНО: Используем socketService вместо socketStore
        socketService.off('online-users:update')
        
        this.isSubscribed = false
        console.log('[OnlineStore] ✅ Отписка завершена')
      } catch (error) {
        console.error('[OnlineStore] ❌ Ошибка отписки от обновлений:', error)
      }
    },

    /**
     * Очистка состояния store
     */
    clear() {
      console.log('[OnlineStore] 🧹 Очистка состояния')
      this.users = []
      this.error = null
      this.isSubscribed = false
      
      // ✅ Также отписываемся от событий при очистке
      this.unsubscribeFromUpdates()
    },

    /**
     * Принудительное обновление данных
     * Комбинирует fetch + subscribe для гарантированной актуальности
     */
    async refresh() {
      try {
        await this.fetchOnlineUsers()
        this.subscribeToUpdates()
      } catch (error) {
        console.error('[OnlineStore] ❌ Ошибка обновления данных:', error)
      }
    }
  }
})
