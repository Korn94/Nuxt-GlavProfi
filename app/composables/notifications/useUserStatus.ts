// app/composables/notifications/useUserStatus.ts
/**
 * Композабл для отслеживания статусов других пользователей
 * 
 * Архитектура:
 * - Подписка на socket события через SocketService
 * - Фильтрация дубликатов событий
 * - Настройки уведомлений (онлайн/офлайн/AFK)
 * - Автоматическая подписка/отписка при монтировании
 */

import { ref, onMounted, onUnmounted } from 'vue'
import { socketService } from 'services/socket.service'
import { useAuthStore } from '../../../stores/auth'
import { useNotifications } from '../useNotifications'
import type { UserStatusEvent } from '../../../server/socket/events/status'

/**
 * Интерфейс настроек уведомлений
 */
export interface UserStatusSettings {
  enabled: boolean
  showOnline: boolean
  showOffline: boolean
  showAFK: boolean
  soundEnabled: boolean
  duration: number
}

/**
 * Композабл для отслеживания статусов других пользователей
 * 
 * @example
 * ```ts
 * const { subscribe, unsubscribe, settings } = useUserStatusNotifications()
 * 
 * onMounted(() => {
 *   subscribe()
 * })
 * 
 * onUnmounted(() => {
 *   unsubscribe()
 * })
 * ```
 */
export function useUserStatusNotifications() {
  // ============================================
  // STORES & COMPOSABLES
  // ============================================
  
  const authStore = useAuthStore()
  const notifications = useNotifications()
  
  // ============================================
  // STATE
  // ============================================
  
  /**
   * Флаг активной подписки
   */
  const isSubscribed = ref(false)
  
  /**
   * Кэш для предотвращения дублирования уведомлений
   * Формат: "timestamp:userId:type"
   */
  const recentEvents = ref<Set<string>>(new Set())
  
  /**
   * Настройки уведомлений
   */
  const settings = ref<UserStatusSettings>({
    enabled: true,
    showOnline: true,
    showOffline: true,
    showAFK: true,
    soundEnabled: false,
    duration: 5000 // 5 секунд
  })
  
  // ============================================
  // METHODS - Cache Management
  // ============================================
  
  /**
   * Очистка кэша старых событий
   * Удаляет события старше 30 секунд
   */
  const cleanupOldEvents = () => {
    const MAX_AGE = 30000 // 30 секунд
    const now = Date.now()
    const eventsToDelete: string[] = []
    
    recentEvents.value.forEach(eventId => {
      const [timestamp] = eventId.split(':')
      if (now - parseInt(timestamp, 10) > MAX_AGE) {
        eventsToDelete.push(eventId)
      }
    })
    
    eventsToDelete.forEach(id => recentEvents.value.delete(id))
  }
  
  /**
   * Проверка дублирующихся событий
   * @param eventId - Уникальный ID события
   * @returns true если событие уже обработано
   */
  const isDuplicateEvent = (eventId: string): boolean => {
    cleanupOldEvents()
    
    if (recentEvents.value.has(eventId)) {
      console.debug('[UserStatus] 🔄 Дубликат события отфильтрован:', eventId)
      return true
    }
    
    recentEvents.value.add(eventId)
    return false
  }
  
  /**
   * Генерация уникального ID события
   * @param data - Данные события статуса
   * @returns Уникальный строковый ID
   */
  const generateEventId = (data: UserStatusEvent): string => {
    const timestamp = new Date(data.timestamp).getTime()
    return `${timestamp}:${data.userId}:${data.type}`
  }
  
  // ============================================
  // METHODS - Notification Helpers
  // ============================================
  
  /**
   * Получение текста уведомления
   * @param data - Данные события статуса
   * @returns Текст уведомления на русском
   */
  const getStatusMessage = (data: UserStatusEvent): string => {
    const userName: string = data.userName || 'Пользователь'
    
    switch (data.type) {
      case 'online':
        return data.fromAFK 
          ? `👤 ${userName} вернулся в сеть`
          : `👤 ${userName} зашел в сеть`
      case 'offline':
        return `👋 ${userName} вышел из сети`
      case 'afk':
        return `🕒 ${userName} отсутствует`
      default:
        return `${userName} изменил статус`
    }
  }
  
  /**
   * Получение типа уведомления для системы
   * @param status - Тип статуса пользователя
   * @returns Тип уведомления для notifications store
   */
  const getNotificationType = (status: 'online' | 'offline' | 'afk'): 'success' | 'info' | 'warning' => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'info'
      case 'afk': return 'warning'
      default: return 'info'
    }
  }
  
  /**
   * Воспроизведение звука уведомления
   */
  const playNotificationSound = () => {
    if (!settings.value.soundEnabled) return
    
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {
        // Игнорируем ошибки воспроизведения (политика браузера)
      })
    } catch (e) {
      console.warn('[UserStatus] ⚠️ Не удалось воспроизвести звук:', e)
    }
  }
  
  // ============================================
  // METHODS - Event Handler
  // ============================================
  
  /**
   * Обработчик события изменения статуса пользователя
   * @param data - Данные события UserStatusEvent
   */
  const handleUserStatus = (data: UserStatusEvent) => {
    console.log('[UserStatus] 📡 Получено событие:', {
      userId: data.userId,
      type: data.type,
      userName: data.userName
    })
    
    // Ждём загрузки данных пользователя
    const currentUserId = authStore.getUser?.id
    if (!currentUserId) {
      console.warn('[UserStatus] ⏳ Ожидание загрузки данных пользователя...')
      return
    }
    
    // Не показываем уведомления о самом себе
    if (data.userId === currentUserId) {
      console.debug('[UserStatus] ⏭️ Пропускаем событие о себе')
      return
    }
    
    // Проверяем дубликаты
    const eventId = generateEventId(data)
    if (isDuplicateEvent(eventId)) {
      return
    }
    
    // Проверяем настройки для конкретного типа статуса
    const showTypeKey = `show${data.type.charAt(0).toUpperCase() + data.type.slice(1)}` as keyof UserStatusSettings
    if (!settings.value[showTypeKey]) {
      console.debug(`[UserStatus] ⏭️ Тип статуса "${data.type}" отключён в настройках`)
      return
    }
    
    // Показываем уведомление
    const message = getStatusMessage(data)
    const type = getNotificationType(data.type)
    
    console.log(`[UserStatus] 🔔 Показ уведомления: ${message}`)
    
    notifications.show({
      type,
      title: 'Статус пользователя',
      message,
      duration: settings.value.duration
    })
    
    // Воспроизводим звук если включено
    if (settings.value.soundEnabled) {
      playNotificationSound()
    }
  }
  
  // ============================================
  // METHODS - Subscription Management
  // ============================================
  
  /**
   * Подписка на события изменения статуса
   */
  const subscribe = () => {
    if (isSubscribed.value) {
      console.log('[UserStatus] ⚠️ Уже подписано на события user:status')
      return
    }
    
    console.log('[UserStatus] 🔔 Подписка на события user:status...')
    
    // ✅ ИСПРАВЛЕНО: Используем socketService вместо socketStore
    socketService.on('user:status', handleUserStatus)
    
    isSubscribed.value = true
    console.log('[UserStatus] ✅ Подписка активна')
  }
  
  /**
   * Отписка от событий изменения статуса
   */
  const unsubscribe = () => {
    if (!isSubscribed.value) {
      console.log('[UserStatus] ⚠️ Уже отписано от событий user:status')
      return
    }
    
    console.log('[UserStatus] 📴 Отписка от событий user:status...')
    
    // ✅ ИСПРАВЛЕНО: Используем socketService вместо socketStore
    socketService.off('user:status', handleUserStatus)
    
    isSubscribed.value = false
    console.log('[UserStatus] ❌ Подписка отменена')
  }
  
  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  
  onMounted(() => {
    console.log('[UserStatus] 📦 Компонент смонтирован - подписываемся...')
    subscribe()
  })
  
  onUnmounted(() => {
    console.log('[UserStatus] 🗑️ Компонент уничтожается - отписываемся...')
    unsubscribe()
  })
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    isSubscribed,
    settings,
    recentEvents,
    
    // Actions
    subscribe,
    unsubscribe,
    
    // Debug methods (для разработки)
    debug: {
      handleEvent: handleUserStatus,
      clearCache: () => {
        recentEvents.value.clear()
        console.log('[UserStatus] 🧹 Кэш событий очищен')
      }
    }
  }
}
