// stores/socket/index.ts
import { defineStore } from 'pinia'
import { io, type Socket } from 'socket.io-client'
import { useCookie } from 'nuxt/app'
import { useAuthStore } from '../auth'
import type { User } from '~/types'
import { watch } from 'vue'

interface SocketState {
  socket: Socket | null
  isConnected: boolean
  error: string | null
  userId: number | null
  isConnecting: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
  reconnectInterval: number
}

export const useSocketStore = defineStore('socket', {
  state: (): SocketState => ({
    socket: null,
    isConnected: false,
    error: null,
    userId: null,
    isConnecting: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectInterval: 2000
  }),
  
  getters: {
    getSocket: (state) => state.socket,
    getIsConnected: (state) => state.isConnected,
    getError: (state) => state.error,
    getUserId: (state) => state.userId,
    getIsConnecting: (state) => state.isConnecting
  },
  
  actions: {
    /**
     * Подключение сокета
     */
    async connect() {
      if (process.server) return
      if (this.isConnected || this.isConnecting) {
        console.log('[SocketStore] Already connected or connecting')
        return
      }
      
      try {
        this.isConnecting = true
        this.error = null
        
        const token = useCookie('auth_token').value
        if (!token) {
          console.error('[SocketStore] No authentication token found')
          this.error = 'No authentication token found'
          this.isConnecting = false
          return
        }
        
        const authStore = useAuthStore()
        if (!authStore.user) {
          console.error('[SocketStore] User data not available')
          this.error = 'User data not available'
          this.isConnecting = false
          return
        }
        
        this.userId = authStore.user.id
        
        // Формируем базовый URL
        const baseUrl = typeof window !== 'undefined' 
          ? window.location.origin 
          : (process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000')
        
        console.log('[SocketStore] Connecting to:', baseUrl)
        
        // Создаем сокет
        const socket = io(baseUrl, {
          auth: { auth_token: token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectInterval,
          withCredentials: true
        })
        
        // Обработчики событий
        socket.on('connect', () => {
          console.log('[SocketStore] ✅ Connected successfully')
          this.$patch({
            isConnected: true,
            isConnecting: false,
            error: null,
            socket
          })
        })
        
        socket.on('connect_error', (err) => {
          console.error('[SocketStore] Connection error:', err.message)
          this.error = `Connection error: ${err.message}`
          this.isConnecting = false
          
          if (err.message.includes('Unauthorized')) {
            console.log('[SocketStore] Unauthorized, logging out...')
            authStore.logout()
          }
        })
        
        socket.on('disconnect', (reason) => {
          console.log('[SocketStore] Disconnected:', reason)
          if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
            this.$patch({
              isConnected: false,
              isConnecting: false,
              socket: null
            })
          }
        })
        
        // Сохраняем сокет
        this.socket = socket
        
      } catch (error) {
        this.error = `Failed to initialize socket: ${error instanceof Error ? error.message : 'Unknown error'}`
        this.isConnecting = false
        console.error('[SocketStore] Initialization error:', error)
      }
    },
    
    /**
     * Отключение сокета
     */
    async disconnect() {
      if (process.server || !this.socket) return
      
      try {
        this.socket.disconnect()
        this.$patch({
          socket: null,
          isConnected: false,
          isConnecting: false,
          userId: null
        })
        console.log('[SocketStore] Disconnected')
      } catch (error) {
        console.error('[SocketStore] Disconnection error:', error)
      }
    },
    
    /**
     * Отправка сообщения через сокет
     */
    sendMessage(event: string, data: any) {
      if (!this.isConnected || !this.socket) {
        console.warn('[SocketStore] Cannot send message: Socket is not connected')
        return
      }
      
      try {
        this.socket.emit(event, data)
      } catch (error) {
        console.error('[SocketStore] Message error:', error)
      }
    },
    
    /**
     * Подписка на событие
     */
    on(event: string, callback: (data: any) => void) {
      if (!this.socket) {
        console.warn('[SocketStore] Socket not initialized, callback will not be registered')
        return
      }
      
      this.socket.on(event, callback)
    },
    
    /**
     * Отписка от события
     */
    off(event: string, callback?: (data: any) => void) {
      if (!this.socket) return
      
      if (callback) {
        this.socket.off(event, callback)
      } else {
        this.socket.off(event)
      }
    }
  }
})
