// app/composables/notifications/useUserStatus.ts
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSocketStore } from '../../../stores/socket'
import { useAuthStore } from '../../../stores/auth'
import { useNotifications } from '../useNotifications'
import type { UserStatusEvent } from '../../../server/socket/events/status'

/**
 * Композабл для отслеживания статусов других пользователей
 */
export function useUserStatusNotifications() {
  const socketStore = useSocketStore()
  const authStore = useAuthStore()
  const notifications = useNotifications()
  const isSubscribed = ref(false)
  
  // Кэш для предотвращения дублирования уведомлений
  const recentEvents = ref<Set<string>>(new Set())
  
  // Настройки уведомлений
  const settings = ref({
    enabled: true,
    showOnline: true,
    showOffline: true,
    showAFK: true,
    soundEnabled: false,
    duration: 5000 // 5 секунд
  })

  /**
   * Очистка кэша старых событий
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
   */
  const isDuplicateEvent = (eventId: string): boolean => {
    cleanupOldEvents()
    
    if (recentEvents.value.has(eventId)) {
      console.debug('[UserStatus] Duplicate event filtered:', eventId)
      return true
    }
    
    recentEvents.value.add(eventId)
    return false
  }

  /**
   * Генерация уникального ID события
   */
  const generateEventId = (data: UserStatusEvent): string => {
    const timestamp = new Date(data.timestamp).getTime()
    return `${timestamp}:${data.userId}:${data.type}`
  }

  /**
   * Получение текста уведомления
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
   * Получение типа уведомления
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
      audio.play().catch(() => {})
    } catch (e) {
      console.warn('[UserStatus] Sound playback failed:', e)
    }
  }

  /**
   * Обработчик события статуса
   */
  const handleUserStatus = (data: UserStatusEvent) => {
    console.log('[UserStatus] Received event:', {
      userId: data.userId,
      type: data.type,
      userName: data.userName
    })

    // Ждём загрузки данных пользователя
    const currentUserId = authStore.getUser?.id
    if (!currentUserId) {
      console.warn('[UserStatus] Waiting for user data...')
      return
    }

    // Не показываем уведомления о самом себе
    if (data.userId === currentUserId) {
      console.debug('[UserStatus] Skipping self event')
      return
    }

    // Проверяем дубликаты
    const eventId = generateEventId(data)
    if (isDuplicateEvent(eventId)) {
      return
    }

    // Проверяем настройки для конкретного типа статуса
    const showTypeKey = `show${data.type.charAt(0).toUpperCase() + data.type.slice(1)}` as keyof typeof settings.value
    if (!settings.value[showTypeKey]) {
      console.debug(`[UserStatus] Status type "${data.type}" disabled in settings`)
      return
    }

    // Показываем уведомление
    const message = getStatusMessage(data)
    const type = getNotificationType(data.type)
    
    console.log(`[UserStatus] Showing notification: ${message}`)
    
    notifications.show({
      type,
      title: 'Статус пользователя',
      message,
      duration: settings.value.duration
    })

    // Воспроизводим звук
    if (settings.value.soundEnabled) {
      playNotificationSound()
    }
  }

  /**
   * Подписка на события
   */
  const subscribe = () => {
    if (isSubscribed.value) return
    
    socketStore.on('user:status', handleUserStatus)
    isSubscribed.value = true
    console.log('[UserStatus] ✅ Subscribed to user:status events')
  }

  /**
   * Отписка от событий
   */
  const unsubscribe = () => {
    if (!isSubscribed.value) return
    
    socketStore.off('user:status', handleUserStatus)
    isSubscribed.value = false
    console.log('[UserStatus] ❌ Unsubscribed from user:status events')
  }

  onMounted(() => {
    console.log('[UserStatus] Mounted - subscribing...')
    subscribe()
  })

  onUnmounted(() => {
    console.log('[UserStatus] Unmounted - unsubscribing...')
    unsubscribe()
  })

  return {
    isSubscribed,
    subscribe,
    unsubscribe,
    settings,
    recentEvents,
    // Методы для отладки
    debug: {
      handleEvent: handleUserStatus,
      clearCache: () => {
        recentEvents.value.clear()
        console.log('[UserStatus] Cache cleared')
      }
    }
  }
}
