// stores/socket.ts
import { defineStore } from 'pinia'
import { io, type Socket } from 'socket.io-client'
import { useCookie } from 'nuxt/app'
import { useAuthStore } from './auth'
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
     * Инициализация сокет-соединения
     */
    async connect() {
      if (process.server) return
      
      try {
        this.isConnecting = true
        this.error = null
        
        // Используем auth_token вместо token
        const token = useCookie('auth_token').value
        if (!token) {
          this.error = 'No authentication token found'
          return
        }
        
        // Получаем информацию о пользователе из хранилища
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated || !authStore.user) {
          this.error = 'User is not authenticated'
          return
        }
        
        // Сохраняем userId для последующих операций
        this.userId = authStore.user.id
        
        // Создаем URL для подключения
        let baseUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        if (typeof window !== 'undefined') {
          baseUrl = window.location.origin
        }
        const socketUrl = baseUrl.replace('http', 'ws')
        
        // Подключаемся к серверу с токеном
        const socket = io(socketUrl, {
          auth: { token },
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectInterval,
          autoConnect: true,
          withCredentials: true
        })
        
        // Обработчики событий сокета
        socket.on('connect', () => {
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.error = null
          console.log('Socket connected successfully')
        })
        
        socket.on('connect_error', (err) => {
          this.error = `Connection error: ${err.message}`
          this.isConnecting = false
          console.error('Socket connection error:', err)
          
          // Проверяем, является ли ошибка связанной с авторизацией
          if (err.message.includes('Unauthorized')) {
            this.disconnect()
            authStore.logout()
          }
        })
        
        socket.on('reconnect_attempt', () => {
          this.reconnectAttempts++
          console.log(`Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        })
        
        socket.on('reconnect_failed', () => {
          this.error = 'Failed to reconnect to the server'
          this.isConnected = false
          this.isConnecting = false
          console.error('Socket reconnection failed')
        })
        
        socket.on('disconnect', (reason) => {
          this.isConnected = false
          this.isConnecting = false
          console.log(`Socket disconnected: ${reason}`)
          
          // Если отключение не вызвано принудительно, пытаемся переподключиться
          if (reason !== 'io server disconnect' && reason !== 'io client disconnect') {
            this.reconnect()
          }
        })
        
        // Привязываем сокет к состоянию
        this.socket = socket
        
        // Обрабатываем события, связанные с пользователем
        socket.on('user:update', (updatedUser: User) => {
          authStore.user = updatedUser
        })
        
        // Добавьте другие обработчики событий по мере необходимости
      } catch (error) {
        this.error = `Failed to initialize socket: ${error instanceof Error ? error.message : 'Unknown error'}`
        this.isConnecting = false
        console.error('Socket initialization error:', error)
      }
    },
    
    /**
     * Отключение сокета
     */
    async disconnect() {
      if (process.server) return
      
      try {
        if (this.socket) {
          this.socket.disconnect()
          this.socket = null
          this.isConnected = false
          this.isConnecting = false
          this.userId = null
          this.reconnectAttempts = 0
          console.log('Socket disconnected')
        }
      } catch (error) {
        console.error('Socket disconnection error:', error)
      }
    },
    
    /**
     * Переподключение сокета
     */
    async reconnect() {
      if (process.server) return
      
      try {
        // Если уже подключено или в процессе подключения, не пытаемся переподключиться
        if (this.isConnected || this.isConnecting) return
        
        // Используем auth_token вместо token
        const token = useCookie('auth_token').value
        if (!token) {
          this.error = 'No authentication token found'
          return
        }
        
        // Проверяем, авторизован ли пользователь
        const authStore = useAuthStore()
        if (!authStore.isAuthenticated || !authStore.user) {
          this.error = 'User is not authenticated'
          return
        }
        
        // Переподключаемся
        await this.disconnect()
        await this.connect()
      } catch (error) {
        this.error = `Failed to reconnect: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('Socket reconnection error:', error)
      }
    },
    
    /**
     * Отправка сообщения через сокет
     */
    sendMessage(event: string, data: any) {
      if (!this.isConnected || !this.socket) {
        this.error = 'Cannot send message: Socket is not connected'
        console.error('Socket is not connected')
        return
      }
      
      try {
        this.socket.emit(event, data)
      } catch (error) {
        this.error = `Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('Socket message error:', error)
      }
    },
    
    /**
     * Подписка на событие
     */
    on(event: string, callback: (data: any) => void) {
      if (!this.socket) {
        this.error = 'Cannot subscribe to event: Socket is not initialized'
        console.error('Socket is not initialized')
        return
      }
      
      try {
        this.socket.on(event, callback)
      } catch (error) {
        this.error = `Failed to subscribe to event: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('Socket subscription error:', error)
      }
    },
    
    /**
     * Отписка от события
     */
    off(event: string, callback?: (data: any) => void) {
      if (!this.socket) {
        this.error = 'Cannot unsubscribe from event: Socket is not initialized'
        console.error('Socket is not initialized')
        return
      }
      
      try {
        if (callback) {
          this.socket.off(event, callback)
        } else {
          this.socket.off(event)
        }
      } catch (error) {
        this.error = `Failed to unsubscribe from event: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error('Socket unsubscription error:', error)
      }
    },
    
    /**
     * Обработка обновления токена
     */
    handleTokenUpdate() {
      if (!this.isConnected) return
      
      try {
        // Используем auth_token вместо token
        const token = useCookie('auth_token').value
        if (!token) {
          this.disconnect()
          return
        }
        
        // Обновляем аутентификацию сокета
        if (this.socket) {
          this.socket.auth = { token }
          this.socket.disconnect().connect()
        }
      } catch (error) {
        console.error('Token update error:', error)
        this.disconnect()
      }
    }
  },
  
  /**
   * Синхронизация с хранилищем авторизации
   */
    async init() {
      const authStore = useAuthStore()
      
      // Подписываемся на изменения аутентификации
      authStore.$subscribe((mutation, state) => {
        // Если пользователь аутентифицирован, подключаем сокет
        if (state.isAuthenticated && !this.isConnected && !this.isConnecting) {
          this.connect()
        }
        // Если пользователь разлогинился, отключаем сокет
        else if (!state.isAuthenticated && this.isConnected) {
          this.disconnect()
        }
      })
      
      // Используем watch вместо $subscribe
      const tokenCookie = useCookie('auth_token')
      watch(tokenCookie, (newValue) => {
        if (newValue && !this.isConnected && !this.isConnecting) {
          this.connect()
        } else if (!newValue && this.isConnected) {
          this.disconnect()
        } else if (newValue && this.isConnected) {
          this.handleTokenUpdate()
        }
      }, { immediate: true })
      
      // Инициализируем сокет, если пользователь уже авторизован
      if (authStore.isAuthenticated && !this.isConnected) {
        await this.connect()
      }
  }
})
