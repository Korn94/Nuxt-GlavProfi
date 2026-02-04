// stores/socket/index.ts
import { defineStore } from 'pinia'
import { socketState } from './state'
import { socketGetters } from './getters'
import * as actions from './actions'
import { setSessionId } from './helpers/sessionId'

// ✅ ДОБАВЛЯЕМ setupConnectionHandlers СЮДА (без activityTracker)
import type { TypedClientSocket } from './types'

function setupConnectionHandlers(this: any, socket: TypedClientSocket) {
  // ✅ ПОДКЛЮЧЕНИЕ
  socket.on('connect', () => {
    // ✅ ПРОВЕРЯЕМ, КАКОЙ ТРАНСПОРТ ИСПОЛЬЗУЕТСЯ
    const transport = socket.io.engine.transport.name
    console.log('[SocketStore] ✅ Connected to server')
    console.log('[SocketStore] Socket ID:', socket.id)
    console.log('[SocketStore] Transport:', transport) // ✅ Добавлено
    
    if (transport === 'websocket') {
      console.log('✅ WebSocket transport active - FAST MODE')
    } else {
      console.warn('⚠️ Using polling transport - SLOW MODE')
    }
    
    this.isConnected = true
    this.isConnecting = false
    this.error = null
    this.reconnectAttempts = 0
    
    // ✅ ОТПРАВЛЯЕМ НАКОПЛЕННЫЕ СООБЩЕНИЯ ИЗ ОЧЕРЕДИ
    this.sendQueuedMessages()
  })
  
  // ✅ ОШИБКА ПОДКЛЮЧЕНИЯ
  socket.on('connect_error', (error: any) => {
    console.error('[SocketStore] ❌ Connection error:', error.message)
    this.isConnecting = false
    this.isConnected = false
    this.error = `Connection error: ${error.message}`
    this.reconnectAttempts++
    
    // ✅ АВТОМАТИЧЕСКИЙ ВЫХОД ПРИ ОШИБКЕ АУТЕНТИФИКАЦИИ
    if (error.message.includes('Unauthorized') || error.message.includes('No token')) {
      console.log('[SocketStore] Authentication failed, logging out...')
      // Динамический импорт для избежания циклических зависимостей
      import('../auth').then(({ useAuthStore }) => {
        const authStore = useAuthStore()
        authStore.logout()
      }).catch(err => {
        console.error('[SocketStore] Failed to import auth store:', err)
      })
    }
  })
  
  // ✅ ОТКЛЮЧЕНИЕ - БЕЗ activityTracker
  socket.on('disconnect', (reason: string) => {
    console.log('[SocketStore] Disconnected:', reason)
    
    // ❌ УДАЛЯЕМ stopActivityTracking() - это вызывало циклическую зависимость
    
    this.isConnected = false
    this.isConnecting = false
    this.userId = null
    
    // ✅ ОЧИЩАЕМ ОЧЕРЕДЬ, ЕСЛИ ОТКЛЮЧЕНИЕ ПОСТОЯННОЕ
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  })
  
  // ✅ ПОПЫТКА ПЕРЕПОДКЛЮЧЕНИЯ
  socket.io.on('reconnect_attempt', (attempt: number) => {
    console.log(`[SocketStore] Reconnection attempt ${attempt}/${this.maxReconnectAttempts}`)
    this.reconnectAttempts = attempt
  })
  
  // ✅ УСПЕШНОЕ ПЕРЕПОДКЛЮЧЕНИЕ
  socket.io.on('reconnect', (attempt: number) => {
    console.log(`[SocketStore] ✅ Reconnected after ${attempt} attempts`)
    this.reconnectAttempts = 0
    this.error = null
  })
  
  // ✅ НЕУДАЧНОЕ ПЕРЕПОДКЛЮЧЕНИЕ
  socket.io.on('reconnect_failed', () => {
    console.error('[SocketStore] ❌ Reconnection failed')
    this.error = 'Failed to reconnect to server'
    this.isConnected = false
    this.isConnecting = false
  })
  
  // ✅ ОШИБКА СЕРВЕРА
  socket.on('error', (error: any) => {
    console.error('[SocketStore] Server error:', error)
    this.error = error.message || 'Unknown server error'
  })
  
  // ✅ ИНИЦИАЛИЗАЦИЯ СЕССИИ
  // @ts-ignore - Socket.IO типизация не поддерживает кастомные события
  socket.on('session:initialized', (data: { sessionId: string; userId: number }) => {
    console.log('[SocketStore] Session initialized:', data.sessionId)
    
    // ✅ СОХРАНЯЕМ SESSION_ID В КУКИ
    setSessionId(data.sessionId)
    
    // ✅ ОБНОВЛЯЕМ СОСТОЯНИЕ
    this.userId = data.userId
  })
}

// ✅ ЭКСПОРТИРУЕМ ВМЕСТЕ С ДРУГИМИ ДЕЙСТВИЯМИ
export const useSocketStore = defineStore('socket', {
  state: socketState,
  getters: socketGetters,
  actions: {
    ...actions,
    setupConnectionHandlers // ✅ Добавляем сюда
  }
})
