// stores/socket/index.ts
/**
 * Socket Store - Управление состоянием подключения Socket.IO
 *
 * Архитектура:
 * - Хранит только реактивное состояние (isConnected, userId, error)
 * - Делегирует всю логику подключения в SocketService
 * - Предоставляет удобные обёртки для компонентов
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { socketService } from 'services/socket.service'
import { setSessionId } from './helpers/sessionId'
import { useCookie } from 'nuxt/app'

/**
 * Генерация уникального идентификатора вкладки
 */
function generateTabId(): string {
  const tabIdCookie = useCookie<string>('tab_id', {
    maxAge: 60 * 60 * 24 * 90,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  if (tabIdCookie.value) {
    return tabIdCookie.value
  }

  const newTabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  tabIdCookie.value = newTabId

  console.log('[SocketStore] 🆔 Сгенерирован новый ID вкладки:', newTabId)
  return newTabId
}

export const useSocketStore = defineStore('socket', () => {
  // ============================================
  // STATE — все поля реактивны через ref()
  // ============================================

  const isConnected = ref(false)
  const isConnecting = ref(false)
  const userId = ref<number | null>(null)
  const error = ref<string | null>(null)
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = ref(5)
  const heartbeatInterval = ref<NodeJS.Timeout | null>(null)
  const messageQueue = ref<Array<{
    event: string
    data: any
    resolve?: (value: any) => void
    reject?: (reason?: any) => void
  }>>([])

  // ============================================
  // GETTERS
  // ============================================

  const connected = computed(() => isConnected.value)
  const hasError = computed(() => !!error.value)
  const isReconnecting = computed(() =>
    reconnectAttempts.value > 0 && reconnectAttempts.value < maxReconnectAttempts.value
  )

  // ============================================
  // ОБРАБОТЧИКИ СОБЫТИЙ SOCKETSERVICE
  // ============================================

  function setupEventHandlers() {
    // ✅ ПОДКЛЮЧЕНИЕ
    socketService.on('connect', () => {
      console.log('[SocketStore] ✅ Подключено к серверу')
      console.log('[SocketStore] 📡 Socket ID:', socketService.getSocketId())

      const transport = socketService.getTransport()
      console.log('[SocketStore] 🚚 Транспорт:', transport)

      isConnected.value = true
      isConnecting.value = false
      error.value = null
      reconnectAttempts.value = 0

      // Регистрируем вкладку
      const tabId = generateTabId()
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
      socketService.emit('tab:register', { tabId, currentPath })
      console.log('[SocketStore] 📌 Вкладка зарегистрирована:', tabId, 'на странице', currentPath)

      // Отправляем накопленные сообщения
      sendQueuedMessages()
    })

    // ✅ ОШИБКА ПОДКЛЮЧЕНИЯ
    socketService.on('connect_error', (err: any) => {
      console.error('[SocketStore] ❌ Ошибка подключения:', err.message)

      isConnecting.value = false
      isConnected.value = false
      error.value = `Ошибка подключения: ${err.message}`
      reconnectAttempts.value++

      // ✅ logout только при невалидном токене, НЕ при его отсутствии
      const isInvalidToken =
        err.message?.includes('Unauthorized') ||
        err.message?.includes('Invalid token') ||
        err.message?.includes('User not found')

      if (isInvalidToken && process.client) {
        console.log('[SocketStore] 🔐 Невалидный токен, выполняем выход...')
        import('../auth').then(({ useAuthStore }) => {
          const authStore = useAuthStore()
          authStore.logout()
        }).catch((importErr) => {
          console.error('[SocketStore] ❌ Не удалось импортировать auth store:', importErr)
        })
      }
    })

    // ✅ ОТКЛЮЧЕНИЕ
    socketService.on('disconnect', (reason: string) => {
      console.log('[SocketStore] 🔌 Отключено:', reason)

      isConnected.value = false
      isConnecting.value = false
      userId.value = null

      if (heartbeatInterval.value) {
        clearInterval(heartbeatInterval.value)
        heartbeatInterval.value = null
      }
    })

    // ✅ ПОПЫТКА ПЕРЕПОДКЛЮЧЕНИЯ
    socketService.on('reconnect_attempt', (attempt: number) => {
      console.log(`[SocketStore] 🔄 Попытка переподключения ${attempt}/${maxReconnectAttempts.value}`)
      reconnectAttempts.value = attempt
    })

    // ✅ УСПЕШНОЕ ПЕРЕПОДКЛЮЧЕНИЕ
    socketService.on('reconnect', (attempt: number) => {
      console.log(`[SocketStore] ✅ Переподключено после ${attempt} попыток`)
      reconnectAttempts.value = 0
      error.value = null
    })

    // ✅ НЕУДАЧНОЕ ПЕРЕПОДКЛЮЧЕНИЕ
    socketService.on('reconnect_failed', () => {
      console.error('[SocketStore] ❌ Не удалось переподключиться после всех попыток')
      error.value = 'Не удалось подключиться к серверу'
      isConnected.value = false
      isConnecting.value = false
    })

    // ✅ ОШИБКА СЕРВЕРА
    socketService.on('error', (err: any) => {
      console.error('[SocketStore] ❌ Ошибка сервера:', err)
      error.value = err.message || 'Неизвестная ошибка сервера'
    })

    // ✅ ИНИЦИАЛИЗАЦИЯ СЕССИИ
    socketService.on('session:initialized', (data: { sessionId: string; userId: number }) => {
      console.log('[SocketStore] 🎫 Сессия инициализирована:', data.sessionId)
      setSessionId(data.sessionId)
      userId.value = data.userId
    })
  }

  // ============================================
  // ACTIONS — Подключение
  // ============================================

  /**
   * Подключение к сокет-серверу
   * Вызывается из plugins/socket.client.ts
   */
  function connect() {
    console.log('[SocketStore] 🔗 Подключение к серверу...')
    isConnecting.value = true
    socketService.connect()
  }

  /**
   * Отключение от сокет-сервера
   */
  function disconnect() {
    console.log('[SocketStore] 🔌 Отключение от сервера...')
    socketService.disconnect()
    isConnected.value = false
    isConnecting.value = false
    userId.value = null
  }

  // ============================================
  // ACTIONS — Подписки на доски
  // ============================================

  function subscribeToBoard(boardId: number) {
    console.log(`[SocketStore] 🔔 Подписка на доску ${boardId}`)
    socketService.subscribeToBoard(boardId)
  }

  function unsubscribeFromBoard(boardId: number) {
    console.log(`[SocketStore] 📴 Отписка от доски ${boardId}`)
    socketService.unsubscribeFromBoard(boardId)
  }

  function unsubscribeFromAll() {
    console.log('[SocketStore] 📴 Отписка от всех досок')
    socketService.unsubscribeFromAll()
  }

  // ============================================
  // ACTIONS — Очередь сообщений
  // ============================================

  function queueMessage<T>(event: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      messageQueue.value.push({
        event,
        data,
        resolve: resolve as (value: any) => void,
        reject
      })

      if (isConnected.value) {
        sendQueuedMessages()
      }
    })
  }

  function sendQueuedMessages() {
    if (messageQueue.value.length === 0) return

    console.log(`[SocketStore] 📤 Отправка ${messageQueue.value.length} сообщений из очереди`)

    while (messageQueue.value.length > 0) {
      const { event, data, resolve, reject } = messageQueue.value.shift()!
      socketService.emit(event, data)
        .then((result: any) => resolve?.(result))
        .catch((err: any) => reject?.(err))
    }
  }

  function clearMessageQueue() {
    console.log('[SocketStore] 🧹 Очистка очереди сообщений')
    messageQueue.value = []
  }

  // ============================================
  // ACTIONS — Heartbeat
  // ============================================

  function startHeartbeat(intervalMs: number = 30000) {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
    }

    console.log(`[SocketStore] 💓 Запуск heartbeat каждые ${intervalMs}мс`)

    heartbeatInterval.value = setInterval(() => {
      if (isConnected.value) {
        socketService.emit('heartbeat', { timestamp: Date.now() }).catch(() => {})
      }
    }, intervalMs)
  }

  function stopHeartbeat() {
    if (heartbeatInterval.value) {
      console.log('[SocketStore] 💓 Остановка heartbeat')
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  // ============================================
  // ACTIONS — Утилиты
  // ============================================

  function clearState() {
    console.log('[SocketStore] 🧹 Очистка состояния')
    stopHeartbeat()
    clearMessageQueue()
    isConnected.value = false
    isConnecting.value = false
    userId.value = null
    error.value = null
    reconnectAttempts.value = 0
  }

  // ============================================
  // ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ
  // ============================================

  // ✅ Вызываем сразу при создании store — один раз
  setupEventHandlers()

  // ============================================
  // RETURN
  // ============================================

  return {
    // State
    isConnected,
    isConnecting,
    userId,
    error,
    reconnectAttempts,
    maxReconnectAttempts,
    messageQueue,

    // Getters
    connected,
    hasError,
    isReconnecting,

    // Actions — Подключение
    connect,
    disconnect,

    // Actions — Подписки
    subscribeToBoard,
    unsubscribeFromBoard,
    unsubscribeFromAll,

    // Actions — Очередь
    queueMessage,
    sendQueuedMessages,
    clearMessageQueue,

    // Actions — Heartbeat
    startHeartbeat,
    stopHeartbeat,

    // Actions — Утилиты
    clearState,
    generateTabId
  }
})
