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
 * ❌ P7: удалены неиспользуемые actions connect()/disconnect() (жизненным циклом
 *    сокета управляют services/socket.service.ts, plugins/socket.client.ts и auth store)
 *    и legacy-очередь сообщений (queueMessage/sendQueuedMessages/clearMessageQueue).
 * ❌ P7: удалена дублирующая обработка невалидного токена — источник правды
 *    services/helpers/socketAuthError.ts, вызов из services/socket.service.ts.
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
    // ✅ P1: на сервере (SSR) подписки не нужны. socketService — module-level синглтон,
    // и каждый SSR-рендер добавлял в него новую пачку обработчиков без возможности удаления (утечка).
    if (!process.client) return

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
    })
    // ✅ ОШИБКА ПОДКЛЮЧЕНИЯ
    socketService.on('connect_error', (err: any) => {
      console.error('[SocketStore] ❌ Ошибка подключения:', err.message)
      isConnecting.value = false
      isConnected.value = false
      error.value = `Ошибка подключения: ${err.message}`

      // ✅ P7: здесь больше нет «legacy»-обработки невалидного токена
      // (сравнение английских строк 'Unauthorized'/'Invalid token'/'User not found'
      // и собственный редирект на /login с обходом authResetInProgress).
      // Единственный владелец сброса авторизации — services/helpers/socketAuthError.ts,
      // вызывающийся из services/socket.service.ts при connect_error.
      // reconnectAttempts тоже не инкрементируем: попытками управляет Manager
      // (событие 'reconnect_attempt' ниже), и раньше счётчик рос даже на
      // неисправимой auth-ошибке.
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
    // ✅ P7: единственная точка записи cookie session_id на клиенте
    // (в SocketService.handleSessionInitialized запись убрана, чтобы не дублировать).
    socketService.on('session:initialized', (data: { sessionId: string; userId: number }) => {
      console.log('[SocketStore] 🎫 Сессия инициализирована:', data.sessionId)
      setSessionId(data.sessionId)
      userId.value = data.userId

      // ✅ ТЕПЕРЬ регистрируем вкладку — sessionId уже есть в cookie!
      if (tabId.value) {
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
        // ✅ P2: fire-and-forget — сервер не отвечает ack на 'tab:register'
        socketService.emitNoAck('tab:register', {
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
  // ACTIONS — Утилиты
  // ============================================

  function clearState() {
    console.log('[SocketStore] 🧹 Очистка состояния')
    isConnected.value = false
    isConnecting.value = false
    userId.value = null
    error.value = null
    reconnectAttempts.value = 0
  }

  // ============================================
  // ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ
  // ============================================

  // ✅ Вызываем сразу при создании store — один раз, и только на клиенте (см. комментарий в setupEventHandlers)
  if (process.client) {
    setupEventHandlers()
  }

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
    tabId,

    // Getters
    connected,
    hasError,
    isReconnecting,

    // Actions — Подписки
    subscribeToBoard,
    unsubscribeFromBoard,
    unsubscribeFromAll,

    // Actions — Утилиты
    clearState,
    generateTabId
  }
})
