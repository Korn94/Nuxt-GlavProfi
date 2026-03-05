// stores/socket/index.ts
/**
 * Socket Store - Управление состоянием подключения Socket.IO
 * 
 * Архитектура:
 * - Хранит только реактивное состояние (isConnected, userId, error)
 * - Делегирует всю логику подключения в SocketService
 * - Предоставляет удобные обёртки для компонентов
 * - Сохраняет вспомогательные функции (generateTabId, setSessionId)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { socketService } from 'services/socket.service'
import { setSessionId } from './helpers/sessionId'
import { useCookie } from 'nuxt/app'

/**
 * Состояние сокета (реактивное для компонентов)
 */
export const socketState = () => ({
  /**
   * Статус подключения к сокет-серверу
   */
  isConnected: false,
  
  /**
   * Статус подключения (в процессе)
   */
  isConnecting: false,
  
  /**
   * ID текущего пользователя (если авторизован)
   */
  userId: null as number | null,
  
  /**
   * Сообщение об ошибке подключения
   */
  error: null as string | null,
  
  /**
   * Количество попыток переподключения
   */
  reconnectAttempts: 0,
  
  /**
   * Максимальное количество попыток переподключения
   */
  maxReconnectAttempts: 5,
  
  /**
   * Интервал heartbeat (для поддержания соединения)
   */
  heartbeatInterval: null as NodeJS.Timeout | null,
  
  /**
   * Очередь сообщений для отправки при восстановлении соединения
   */
  messageQueue: [] as Array<{
    event: string
    data: any
    resolve?: (value: any) => void
    reject?: (reason?: any) => void
  }>
})

/**
 * Генерация уникального идентификатора вкладки
 * @returns Уникальный ID вкладки
 */
function generateTabId(): string {
  const tabIdCookie = useCookie<string>('tab_id', {
    maxAge: 60 * 60 * 24 * 90, // 90 дней
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
  
  // Если уже есть сохранённый tabId - используем его
  if (tabIdCookie.value) {
    return tabIdCookie.value
  }
  
  // Генерируем новый уникальный идентификатор
  const newTabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  tabIdCookie.value = newTabId
  
  console.log('[SocketStore] 🆔 Сгенерирован новый ID вкладки:', newTabId)
  return newTabId
}

/**
 * Инициализация обработчиков событий SocketService
 * @param socketStore - Экземпляр store для обновления состояния
 */
function setupSocketEventHandlers(socketStore: ReturnType<typeof useSocketStore>) {
  // ✅ ПОДКЛЮЧЕНИЕ
  socketService.on('connect', () => {
    console.log('[SocketStore] ✅ Подключено к серверу')
    console.log('[SocketStore] 📡 Socket ID:', socketService.getSocketId())
    
    // ✅ ПРОВЕРКА ТРАНСПОРТА
    const transport = socketService.getTransport()
    console.log('[SocketStore] 🚚 Транспорт:', transport)
    
    if (transport === 'websocket') {
      console.log('[SocketStore] ✅ WebSocket transport active - FAST MODE')
    } else {
      console.warn('[SocketStore] ⚠️ Using polling transport - SLOW MODE')
    }
    
    // Обновляем состояние store
    socketStore.isConnected = true
    socketStore.isConnecting = false
    socketStore.error = null
    socketStore.reconnectAttempts = 0
    
    // ✅ РЕГИСТРИРУЕМ ВКЛАДКУ ПРИ ПОДКЛЮЧЕНИИ
    const tabId = generateTabId()
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
    
    socketService.emit('tab:register', {
      tabId,
      currentPath
    })
    
    console.log('[SocketStore] 📌 Вкладка зарегистрирована:', tabId, 'на странице', currentPath)
    
    // ✅ ОТПРАВЛЯЕМ НАКОПЛЕННЫЕ СООБЩЕНИЯ ИЗ ОЧЕРЕДИ
    socketStore.sendQueuedMessages()
  })
  
  // ✅ ОШИБКА ПОДКЛЮЧЕНИЯ
  socketService.on('connect_error', (error: any) => {
    console.error('[SocketStore] ❌ Ошибка подключения:', error.message)
    
    socketStore.isConnecting = false
    socketStore.isConnected = false
    socketStore.error = `Ошибка подключения: ${error.message}`
    socketStore.reconnectAttempts++
    
    // ✅ АВТОМАТИЧЕСКИЙ ВЫХОД ПРИ ОШИБКЕ АУТЕНТИФИКАЦИИ
    if (error.message?.includes('Unauthorized') || error.message?.includes('No token')) {
      console.log('[SocketStore] 🔐 Ошибка аутентификации, выполняем выход...')
      
      // Динамический импорт для избежания циклических зависимостей
      if (process.client) {
        import('../auth').then(({ useAuthStore }) => {
          const authStore = useAuthStore()
          authStore.logout()
        }).catch(err => {
          console.error('[SocketStore] ❌ Не удалось импортировать auth store:', err)
        })
      }
    }
  })
  
  // ✅ ОТКЛЮЧЕНИЕ
  socketService.on('disconnect', (reason: string) => {
    console.log('[SocketStore] 🔌 Отключено:', reason)
    
    socketStore.isConnected = false
    socketStore.isConnecting = false
    socketStore.userId = null
    
    // ✅ ОЧИЩАЕМ HEARTBEAT ПРИ ОТКЛЮЧЕНИИ
    if (socketStore.heartbeatInterval) {
      clearInterval(socketStore.heartbeatInterval)
      socketStore.heartbeatInterval = null
    }
  })
  
  // ✅ ПОПЫТКА ПЕРЕПОДКЛЮЧЕНИЯ
  socketService.on('reconnect_attempt', (attempt: number) => {
    console.log(`[SocketStore] 🔄 Попытка переподключения ${attempt}/${socketStore.maxReconnectAttempts}`)
    socketStore.reconnectAttempts = attempt
  })
  
  // ✅ УСПЕШНОЕ ПЕРЕПОДКЛЮЧЕНИЕ
  socketService.on('reconnect', (attempt: number) => {
    console.log(`[SocketStore] ✅ Переподключено после ${attempt} попыток`)
    
    socketStore.reconnectAttempts = 0
    socketStore.error = null
  })
  
  // ✅ НЕУДАЧНОЕ ПЕРЕПОДКЛЮЧЕНИЕ
  socketService.on('reconnect_failed', () => {
    console.error('[SocketStore] ❌ Не удалось переподключиться после всех попыток')
    
    socketStore.error = 'Не удалось подключиться к серверу'
    socketStore.isConnected = false
    socketStore.isConnecting = false
  })
  
  // ✅ ОШИБКА СЕРВЕРА
  socketService.on('error', (error: any) => {
    console.error('[SocketStore] ❌ Ошибка сервера:', error)
    socketStore.error = error.message || 'Неизвестная ошибка сервера'
  })
  
  // ✅ СЕССИЯ
  socketService.on('session:initialized', (data: { sessionId: string; userId: number }) => {
    console.log('[SocketStore] 🎫 Сессия инициализирована:', data.sessionId)
    
    // ✅ СОХРАНЯЕМ SESSION_ID В КУКИ
    setSessionId(data.sessionId)
    
    // ✅ ОБНОВЛЯЕМ СОСТОЯНИЕ
    socketStore.userId = data.userId
  })
}

/**
 * Pinia store для управления сокет-соединением
 */
export const useSocketStore = defineStore('socket', () => {
  // ============================================
  // STATE
  // ============================================
  
  const state = socketState()
  
  // ============================================
  // COMPUTED / GETTERS
  // ============================================
  
  /**
   * Проверка статуса подключения
   */
  const connected = computed(() => state.isConnected)
  
  /**
   * Проверка наличия ошибок
   */
  const hasError = computed(() => !!state.error)
  
  /**
   * Проверка, идёт ли переподключение
   */
  const isReconnecting = computed(() => 
    state.reconnectAttempts > 0 && state.reconnectAttempts < state.maxReconnectAttempts
  )
  
  // ============================================
  // ACTIONS - Initialization
  // ============================================
  
  /**
   * Инициализация сокет-сервиса
   * Вызывается один раз при старте приложения
   */
  function init() {
    console.log('[SocketStore] 🚀 Инициализация Socket.IO...')
    
    // Инициализируем SocketService
    socketService.init()
    
    // Настраиваем обработчики событий
    setupSocketEventHandlers({ ...state, ...getters } as any)
    
    console.log('[SocketStore] ✅ Socket.IO инициализирован')
  }
  
  /**
   * Подключение к сокет-серверу
   */
  function connect() {
    console.log('[SocketStore] 🔗 Подключение к серверу...')
    state.isConnecting = true
    socketService.connect()
  }
  
  /**
   * Отключение от сокет-сервера
   */
  function disconnect() {
    console.log('[SocketStore] 🔌 Отключение от сервера...')
    socketService.disconnect()
    
    // Сбрасываем состояние
    state.isConnected = false
    state.isConnecting = false
    state.userId = null
  }
  
  // ============================================
  // ACTIONS - Subscription Management
  // ============================================
  
  /**
   * Подписаться на обновления доски
   * @param boardId - ID доски
   */
  function subscribeToBoard(boardId: number) {
    console.log(`[SocketStore] 🔔 Подписка на доску ${boardId}`)
    socketService.subscribeToBoard(boardId)
  }
  
  /**
   * Отписаться от обновлений доски
   * @param boardId - ID доски
   */
  function unsubscribeFromBoard(boardId: number) {
    console.log(`[SocketStore] 📴 Отписка от доски ${boardId}`)
    socketService.unsubscribeFromBoard(boardId)
  }
  
  /**
   * Отписаться от всех досок
   */
  function unsubscribeFromAll() {
    console.log('[SocketStore] 📴 Отписка от всех досок')
    socketService.unsubscribeFromAll()
  }
  
  // ============================================
  // ACTIONS - Message Queue
  // ============================================
  
  /**
   * Добавить сообщение в очередь
   * @param event - Имя события
   * @param data - Данные события
   * @returns Promise с результатом отправки
   */
  function queueMessage<T>(event: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      state.messageQueue.push({
        event,
        data,
        resolve: resolve as (value: any) => void,
        reject
      })
      
      // Если подключены - отправляем сразу
      if (state.isConnected) {
        sendQueuedMessages()
      }
    })
  }
  
  /**
   * Отправить все сообщения из очереди
   */
  function sendQueuedMessages() {
    if (state.messageQueue.length === 0) return
    
    console.log(`[SocketStore] 📤 Отправка ${state.messageQueue.length} сообщений из очереди`)
    
    while (state.messageQueue.length > 0) {
      const { event, data, resolve, reject } = state.messageQueue.shift()!
      
      socketService.emit(event, data)
        .then((result: any) => resolve?.(result))
        .catch((error: any) => reject?.(error))
    }
  }
  
  /**
   * Очистить очередь сообщений
   */
  function clearMessageQueue() {
    console.log('[SocketStore] 🧹 Очистка очереди сообщений')
    state.messageQueue = []
  }
  
  // ============================================
  // ACTIONS - Heartbeat
  // ============================================
  
  /**
   * Запустить heartbeat для поддержания соединения
   * @param intervalMs - Интервал в миллисекундах (по умолчанию 30000)
   */
  function startHeartbeat(intervalMs: number = 30000) {
    if (state.heartbeatInterval) {
      clearInterval(state.heartbeatInterval)
    }
    
    console.log(`[SocketStore] 💓 Запуск heartbeat каждые ${intervalMs}мс`)
    
    state.heartbeatInterval = setInterval(() => {
      if (state.isConnected) {
        socketService.emit('heartbeat', { timestamp: Date.now() }).catch(() => {})
      }
    }, intervalMs)
  }
  
  /**
   * Остановить heartbeat
   */
  function stopHeartbeat() {
    if (state.heartbeatInterval) {
      console.log('[SocketStore] 💓 Остановка heartbeat')
      clearInterval(state.heartbeatInterval)
      state.heartbeatInterval = null
    }
  }
  
  // ============================================
  // ACTIONS - Utility
  // ============================================
  
  /**
   * Очистить состояние store
   */
  function clearState() {
    console.log('[SocketStore] 🧹 Очистка состояния')
    
    stopHeartbeat()
    clearMessageQueue()
    
    state.isConnected = false
    state.isConnecting = false
    state.userId = null
    state.error = null
    state.reconnectAttempts = 0
  }
  
  // ============================================
  // GETTERS (обёртки)
  // ============================================
  
  const getters = {
    connected,
    hasError,
    isReconnecting,
    
    /**
     * Получить ID текущего пользователя
     */
    getUserId: () => state.userId,
    
    /**
     * Получить сообщение об ошибке
     */
    getError: () => state.error,
    
    /**
     * Получить количество попыток переподключения
     */
    getReconnectAttempts: () => state.reconnectAttempts
  }
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    ...state,
    
    // Getters
    ...getters,
    
    // Actions - Initialization
    init,
    connect,
    disconnect,
    
    // Actions - Subscription
    subscribeToBoard,
    unsubscribeFromBoard,
    unsubscribeFromAll,
    
    // Actions - Message Queue
    queueMessage,
    sendQueuedMessages,
    clearMessageQueue,
    
    // Actions - Heartbeat
    startHeartbeat,
    stopHeartbeat,
    
    // Actions - Utility
    clearState,
    
    // Utility functions
    generateTabId
  }
})
