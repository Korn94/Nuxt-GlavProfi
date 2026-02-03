// composables/useNotifications.ts
import { useNotificationStore } from '../../stores/notifications'

export function useNotifications() {
  const notificationStore = useNotificationStore()
  
  return {
    /**
     * Показать уведомление об успехе
     */
    success: (message: string, title?: string) => {
      notificationStore.success(message, title)
    },
    
    /**
     * Показать уведомление об ошибке
     */
    error: (message: string, title?: string) => {
      notificationStore.error(message, title)
    },
    
    /**
     * Показать предупреждение
     */
    warning: (message: string, title?: string) => {
      notificationStore.warning(message, title)
    },
    
    /**
     * Показать информационное уведомление
     */
    info: (message: string, title?: string) => {
      notificationStore.info(message, title)
    },
    
    /**
     * Показать кастомное уведомление
     */
    show: (notification: {
      type: 'success' | 'error' | 'warning' | 'info'
      title: string
      message: string
      duration?: number
      actions?: Array<{
        text: string
        class?: string
        closeOnAction?: boolean
        onClick?: () => void
      }>
    }) => {
      notificationStore.show(notification)
    },
    
    /**
     * Очистить все уведомления
     */
    clear: () => {
      notificationStore.clear()
    }
  }
}
