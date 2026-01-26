// stores/presence.ts
import { defineStore } from 'pinia'
import { useWebSocketStore } from './websocket'

export interface PresenceUser {
  id: number
  login: string
  name: string
  roles: string[]
  status: 'online' | 'idle'
  lastActivityAt: number
  deviceType?: string
  tabCount?: number
  currentPage?: string
  onlineSince?: number
  ip?: string
}

export const usePresenceStore = defineStore('presence', {
  state: () => ({
    users: [] as PresenceUser[],
    connectionStatus: 'connected' as 'connected' | 'disconnected' | 'reconnecting',
    debug: false
  }),
  
  getters: {
    online: (state) => {
      const result = state.users.filter(u => u.status === 'online')
      return result
    },
    idle: (state) => {
      const result = state.users.filter(u => u.status === 'idle')
      return result
    },
    onlineCount: (state) => state.users.filter(u => u.status === 'online').length,
    idleCount: (state) => state.users.filter(u => u.status === 'idle').length,
    isConnected: (state) => state.connectionStatus === 'connected'
  },
  
  actions: {
    processMessage(message: any) {
      if (message.type === 'presence:update' && Array.isArray(message.users)) {
        this.update(message.users)
      }
    },
    
    update(users: PresenceUser[]) {
      // Создаем карту пользователей по ID
      const userMap = new Map<number, PresenceUser>()
      
      // Добавляем существующих пользователей
      this.users.forEach(user => {
        if (user.id) {
          userMap.set(user.id, user)
        }
      })
      
      // Обновляем данными из нового списка
      users.forEach(user => {
        if (user.id) {
          // Если пользователь уже есть, обновляем его данные
          const existing = userMap.get(user.id)
          if (existing && existing.lastActivityAt > user.lastActivityAt) {
            return
          }
          userMap.set(user.id, user)
        }
      })
      
      // Обновляем состояние
      this.users = Array.from(userMap.values())
    },
    
    sendActivity() {
      const websocketStore = useWebSocketStore()
      if (websocketStore.isConnected) {
        websocketStore.send({
          type: 'presence:activity'
        })
      }
    },
    
    sendIdleStatus() {
      const websocketStore = useWebSocketStore()
      if (websocketStore.isConnected) {
        websocketStore.send({
          type: 'presence:idle'
        })
      }
    },
    
    sendPageUpdate(page: string) {
      const websocketStore = useWebSocketStore()
      if (websocketStore.isConnected) {
        websocketStore.send({
          type: 'presence:page-update',
          currentPage: page
        })
      }
    },
    
    sendDeviceInfo(deviceInfo: {
      deviceType?: string;
      tabCount?: number;
    }) {
      const websocketStore = useWebSocketStore()
      if (websocketStore.isConnected) {
        websocketStore.send({
          type: 'presence:device-info',
          ...deviceInfo
        })
      }
    },
    
    setConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting') {
      this.connectionStatus = status
    }
  }
})
