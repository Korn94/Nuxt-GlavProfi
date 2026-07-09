// stores/socket/index.ts
/**
 * Socket Store - Управление состоянием подключения Socket.IO
 *
 * Архитектура:
 * - Хранит только реактивное состояние (isConnected, userId, error)
 * - Делегирует всю логику подключения в SocketService
 * - Предоставляет удобные обёртки для компонентов
 * - 🆕 Обрабатывает уведомления об изменении прав
 * - 🆕 Обрабатывает принудительное отключение
 *
 * ❌ Heartbeat удалён (P2.8) — дублирует Activity Tracking в SocketService
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { socketService } from 'services/socket.service'
import { setSessionId } from 'services/helpers/sessionId'
import { useCookie } from 'nuxt/app'
import { useNotifications } from '~/composables/useNotifications'
import { useAuthStore } from 'stores/auth'

/**
 * Генерация уникального идентификатора вкладки
 */
function generateTabId(): string {
  if (!process.client) return '' // На сервере вкладок не существует

  const STORAGE_KEY = 'socket_tab_id'
  const existing = sessionStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const newTabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  sessionStorage.setItem(STORAGE_KEY, newTabId)
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
  const tabId = ref<string | null>(null)
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
    const notifications = useNotifications()
    const authStore = useAuthStore()

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

      // ✅ Генерируем ID вкладки, но НЕ регистрируем — ждём session:initialized
      tabId.value = generateTabId()
      console.log('[SocketStore] 🆔 Вкладка подготовлена:', tabId.value, '(регистрация после получения sessionId)')

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

      // 🔐 Очищаем куки только при невалидном токене, НЕ при его отсутствии
      const isInvalidToken =
        err.message?.includes('Unauthorized') ||
        err.message?.includes('Invalid token') ||
        err.message?.includes('User not found')

      if (isInvalidToken && process.client) {
        console.log('[SocketStore] 🔐 Невалидный токен, очищаем состояние')
        useCookie('auth_token').value = null
        useCookie('session_id').value = null
        // Не вызываем logout() чтобы избежать циклических зависимостей и Buffer errors
        window.location.href = '/login'
      }
    })

    // ✅ ОТКЛЮЧЕНИЕ
    socketService.on('disconnect', (reason: string) => {
      console.log('[SocketStore] 🔌 Отключено:', reason)
      isConnected.value = false
      isConnecting.value = false
      userId.value = null
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

      // ✅ ТЕПЕРЬ регистрируем вкладку — sessionId уже есть в cookie!
      if (tabId.value) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
        socketService.emit('tab:register', {
          tabId: tabId.value,
          currentPath,
          sessionId: data.sessionId  // Передаём sessionId явно для надёжности
        })
        console.log('[SocketStore] 📌 Вкладка зарегистрирована:', tabId.value, 'на странице', currentPath)
      }
    })

    // ============================================
    // 🆕 ОБРАБОТКА ИЗМЕНЕНИЯ ПРАВ
    // ============================================

    // Сервер уведомляет что права пользователя изменились
    socketService.on('permissions:changed', async (data: {
      reason: string
      changedPages: string[]
      requireRelogin: boolean
      timestamp: string
    }) => {
      console.log('[SocketStore] 📣 Права изменены:', data)

      // Показываем уведомление пользователю
      notifications.warning(
        data.reason,
        'Права доступа обновлены'
      )

      if (data.requireRelogin) {
        // Требуется повторный вход — разлогиниваем
        notifications.info('Необходимо войти в систему заново', 'Сессия завершена')
        setTimeout(() => {
          authStore.logout()
        }, 2000) // Даём время прочитать уведомление
      } else {
        // Просто перезагружаем права
        console.log('[SocketStore] 🔄 Перезагрузка прав через /api/permissions...')
        try {
          await authStore.init()
          notifications.success('Права обновлены', 'Изменения применены')
        } catch (error) {
          console.error('[SocketStore] Ошибка перезагрузки прав:', error)
          notifications.error('Не удалось обновить права', 'Ошибка')
        }
      }
    })

    // ============================================
    // 🆕 ПРИНУДИТЕЛЬНОЕ ОТКЛЮЧЕНИЕ
    // ============================================

    // Сервер принудительно разрывает соединение
    socketService.on('force:disconnect', (data: {
      reason: string
      timestamp: string
    }) => {
      console.error('[SocketStore] 🔌 Принудительное отключение:', data.reason)

      // Показываем уведомление
      notifications.error(
        data.reason,
        'Сессия завершена администратором'
      )

      // Очищаем состояние
      useCookie('auth_token').value = null
      useCookie('session_id').value = null

      // Разрываем соединение
      socketService.disconnect()

      // Перенаправляем на логин через 2 секунды (чтобы пользователь успел прочитать)
      setTimeout(() => {
        if (process.client) {
          window.location.href = '/login'
        }
      }, 2000)
    })

    // ============================================
    // 🆕 ПОДТВЕРЖДЕНИЕ ПРОВЕРКИ ПРАВ
    // ============================================

    socketService.on('permissions:check:ack', (data: {
      timestamp: string
      message: string
    }) => {
      console.log('[SocketStore] ✅ Подтверждение проверки прав:', data.message)
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
  // ACTIONS — Утилиты
  // ============================================

  function clearState() {
    console.log('[SocketStore] 🧹 Очистка состояния')
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
    tabId,

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

    // Actions — Утилиты
    clearState,
    generateTabId
  }
})
