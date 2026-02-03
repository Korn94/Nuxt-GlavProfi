// stores/notifications.ts
import { defineStore } from 'pinia'
import type { NotificationType, NotificationAction } from '~/types/notifications'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  visible: boolean
  actions?: NotificationAction[]
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    maxVisible: 5,
  }),
  
  actions: {
    /**
     * Показать уведомление
     */
    show(notification: Omit<Notification, 'id' | 'visible'>) {
      const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      const newNotification: Notification = {
        id,
        visible: true,
        ...notification,
      }
      
      // Добавляем уведомление в начало массива
      this.notifications.unshift(newNotification)
      
      // Ограничиваем количество видимых уведомлений
      if (this.notifications.length > this.maxVisible) {
        const oldest = this.notifications.pop()
        if (oldest) {
          this.remove(oldest.id)
        }
      }
      
      // Автоматическое удаление через время
      const duration = notification.duration || 6000
      setTimeout(() => {
        this.remove(id)
      }, duration)
      
      return id
    },
    
    /**
     * Показать уведомление об успехе
     */
    success(message: string, title = 'Успех') {
      return this.show({
        type: 'success',
        title,
        message,
      })
    },
    
    /**
     * Показать уведомление об ошибке
     */
    error(message: string, title = 'Ошибка') {
      return this.show({
        type: 'error',
        title,
        message,
      })
    },
    
    /**
     * Показать предупреждение
     */
    warning(message: string, title = 'Внимание') {
      return this.show({
        type: 'warning',
        title,
        message,
      })
    },
    
    /**
     * Показать информационное уведомление
     */
    info(message: string, title = 'Информация') {
      return this.show({
        type: 'info',
        title,
        message,
      })
    },
    
    /**
     * Закрыть уведомление
     */
    close(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.visible = false
        setTimeout(() => {
          this.remove(id)
        }, 300)
      }
    },
    
    /**
     * Удалить уведомление из состояния
     */
    remove(id: string) {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },
    
    /**
     * Очистить все уведомления
     */
    clear() {
      this.notifications.forEach(n => {
        n.visible = false
      })
      setTimeout(() => {
        this.notifications = []
      }, 300)
    },
    
    /**
     * Обработка действия в уведомлении
     */
    handleAction(id: string, action: NotificationAction) {
      if (action.onClick) {
        action.onClick()
      }
      if (action.closeOnAction !== false) {
        this.close(id)
      }
    }
  }
})
