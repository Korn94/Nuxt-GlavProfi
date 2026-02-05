// composables/useNotifications.ts
import { useNotificationStore } from '../../stores/notifications'

/**
 * Универсальный композабл для работы с уведомлениями
 */
export function useNotifications() {
  const notificationStore = useNotificationStore()

  return {
    // Быстрые методы
    success: (message: string, title = 'Успех') => {
      return notificationStore.success(message, title)
    },
    
    error: (message: string, title = 'Ошибка') => {
      return notificationStore.error(message, title)
    },
    
    warning: (message: string, title = 'Внимание') => {
      return notificationStore.warning(message, title)
    },
    
    info: (message: string, title = 'Информация') => {
      return notificationStore.info(message, title)
    },
    
    // Полный метод
    show: notificationStore.show.bind(notificationStore),
    
    // Управление
    clear: notificationStore.clear.bind(notificationStore),
    
    // Статус
    get notifications() {
      return notificationStore.notifications
    }
  }
}
