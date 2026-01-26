// stores/notifications.ts
import { defineStore } from 'pinia'

export interface Notification {
  id: number
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  expiresAt?: string
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    notifications: [] as Notification[],
    loading: false,
    debug: false
  }),
  
  getters: {
    unreadCount: (state) => state.notifications.filter(n => !n.read).length,
    unreadNotifications: (state) => state.notifications.filter(n => !n.read),
    recentNotifications: (state) => 
      [...state.notifications]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
  },
  
  actions: {
    processMessage(message: any) {
      if (message.type === 'notifications:new' && message.notification) {
        this.addNotification(message.notification)
      }
    },
    
    addNotification(notification: Notification) {
      // Проверяем, не существует ли уже уведомление с таким ID
      const exists = this.notifications.some(n => n.id === notification.id)
      
      if (!exists) {
        this.notifications.unshift(notification)
      } else {
        // Обновляем существующее уведомление
        const index = this.notifications.findIndex(n => n.id === notification.id)
        if (index !== -1) {
          this.notifications[index] = notification
        }
      }
    },
    
    markAsRead(notificationId: number) {
      const index = this.notifications.findIndex(n => n.id === notificationId)
      // Добавлена проверка на существование элемента
      if (index !== -1 && this.notifications[index]) {
        this.notifications[index].read = true
      }
    },
    
    markAllAsRead() {
      this.notifications.forEach(notification => {
        notification.read = true
      })
    },
    
    removeNotification(notificationId: number) {
      this.notifications = this.notifications.filter(n => n.id !== notificationId)
    },
    
    clearAll() {
      this.notifications = []
    },
    
    sendNotification(notification: Omit<Notification, 'id' | 'createdAt'>) {
      console.log('Sending notification:', notification)
      // Этот метод будет использоваться для отправки уведомлений через WebSocket
    }
  }
})
