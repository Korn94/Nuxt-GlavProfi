// app/composables/notifications/useUserStatus.ts
import { onMounted, onUnmounted, ref } from 'vue'
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
  const recentEvents = ref<Set<string>>(new Set())
  
  // ✅ НАСТРОЙКИ ПРЯМО В КОМПОЗАБЛЕ (без отдельного стора)
  const settings = {
    enabled: true,
    showOnline: true,
    showOffline: true,
    showAFK: true,
    soundEnabled: false,
    duration: 3000
  }

  // Отладка: логируем подключение
  console.log('[UserStatus] Composable initialized', {
    userId: authStore.getUser?.id,
    userName: authStore.getUser?.name
  })

  /**
   * Фильтрация дублирующихся событий (защита от спама)
   */
  const isDuplicateEvent = (eventId: string): boolean => {
    const MAX_AGE = 15000 // 15 секунд
    
    const now = Date.now()
    const eventsToDelete: string[] = []
    
    recentEvents.value.forEach(eventId => {
      const [timestamp] = eventId.split(':')
      if (now - parseInt(timestamp, 10) > MAX_AGE) {
        eventsToDelete.push(eventId)
      }
    })
    
    eventsToDelete.forEach(id => recentEvents.value.delete(id))
    
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
    const userName: string = data.userName ?? 'Пользователь'
    
    switch (data.type) {
      case 'online':
        return data.fromAFK 
          ? `${userName} вернулся в сеть`
          : `${userName} зашел в сеть`
      case 'offline':
        return `${userName} вышел из сети`
      case 'afk':
        return `${userName} отсутствует`
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
    if (!settings.soundEnabled) return
    
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.3
      audio.play().catch(() => {})
    } catch (e) {
      console.warn('[UserStatus] Sound playback failed:', e)
    }
  }

  /**
   * Обработчик события статуса - ОСНОВНАЯ ЛОГИКА
   */
  const handleUserStatus = (data: UserStatusEvent) => {
    console.log('[UserStatus] Received event:', data)
    
    // ✅ КРИТИЧЕСКИ ВАЖНО: Не показываем уведомления о самом себе
    const currentUserId = authStore.getUser?.id
    if (!currentUserId) {
      console.warn('[UserStatus] Current user ID not available, skipping event')
      return
    }
    
    if (data.userId === currentUserId) {
      console.debug('[UserStatus] Skipping self event:', data.userId)
      return
    }

    // Проверяем дубликаты
    const eventId = generateEventId(data)
    if (isDuplicateEvent(eventId)) {
      return
    }

    // ✅ Проверяем настройки
    if (!settings.enabled) {
      console.debug('[UserStatus] Notifications disabled')
      return
    }

    // Проверяем конкретный тип статуса
    const showTypeKey = `show${data.type.charAt(0).toUpperCase() + data.type.slice(1)}` as keyof typeof settings
    if (!settings[showTypeKey]) {
      console.debug(`[UserStatus] Status type "${data.type}" disabled`)
      return
    }

    // ✅ Показываем уведомление
    const message = getStatusMessage(data)
    const type = getNotificationType(data.type)
    
    console.log(`[UserStatus] Showing notification: ${message}`)
    
    notifications.show({
      type,
      title: 'Статус пользователя',
      message,
      duration: settings.duration
    })

    // Воспроизводим звук
    if (settings.soundEnabled) {
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
    settings, // ✅ Возвращаем настройки
    recentEvents,
    debug: {
      handleEvent: handleUserStatus,
      clearCache: () => {
        recentEvents.value.clear()
        console.log('[UserStatus] Cache cleared')
      }
    }
  }
}
