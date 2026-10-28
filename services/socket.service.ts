// services/socket.service.ts
/**
 * Централизованный сервис для работы с Socket.IO
 *
 * Архитектура:
 * - Единая точка подключения к сокет-серверу
 * - Подписка на комнаты досок (board:{boardId})
 * - Обработка всех socket-событий (tasks, subtasks, columns, etc.)
 * - Интеграция с Pinia stores
 * - Клиент-сайдовый только (process.client)
 * - ✅ Поддержка нового JSON-формата куки авторизации
 * - ✅ Трекинг активности пользователя: app/composables/useActivityTracker.ts (в сервисе не дублируется)
 */

import { io, type Socket } from 'socket.io-client'
import { useCookie, useRuntimeConfig } from 'nuxt/app'
import type { Subtask, Task, BoardColumn } from '~/types/boards'
import { handleInvalidSocketAuth, isInvalidSocketAuthError } from 'services/helpers/socketAuthError'

// ============================================
// ТИПЫ СОБЫТИЙ
// ============================================
type SocketEventHandler<T = any> = (data: T) => void

interface EventHandlerMap {
  // События подключения
  'connect': SocketEventHandler
  'disconnect': SocketEventHandler<string>
  'connect_error': SocketEventHandler<any>
  'reconnect_attempt': SocketEventHandler<number>
  'reconnect': SocketEventHandler<number>
  'reconnect_failed': SocketEventHandler
  'error': SocketEventHandler<any>

  // События сессии
  'session:initialized': SocketEventHandler<{ sessionId: string; userId: number }>

  // События вкладок
  'tab:registered': SocketEventHandler<{ tabId: string; currentPath: string }>
  'board:subscribed': SocketEventHandler<{ boardId: number; success: boolean }>
  'board:unsubscribed': SocketEventHandler<{ success: boolean }>

  // События задач
  'board:task:created': SocketEventHandler<{ task: Task; boardId: number }>
  'board:task:updated': SocketEventHandler<{ task: Task; boardId: number }>
  'board:task:deleted': SocketEventHandler<{ taskId: number; boardId: number }>
  'board:tasks:reordered': SocketEventHandler<{
    boardId: number
    status: string
    tasks: Array<{ id: number; order: number }>
  }>

  // События подзадач
  'board:subtask:created': SocketEventHandler<{ subtask: Subtask; boardId: number }>
  'board:subtask:updated': SocketEventHandler<{ subtask: Subtask; boardId: number }>
  'board:subtask:deleted': SocketEventHandler<{
    subtaskId: number
    taskId: number
    boardId: number
  }>

  // События колонок
  'board:column:created': SocketEventHandler<{ column: BoardColumn; boardId: number }>
  'board:column:updated': SocketEventHandler<{ column: BoardColumn; boardId: number }>
  'board:column:deleted': SocketEventHandler<{ columnId: number; boardId: number }>
  'board:columns:reordered': SocketEventHandler<{
    boardId: number
    columns: Array<{ id: number; order: number }>
  }>

  // Динамические события
  [key: string]: SocketEventHandler
}

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
interface SocketServiceConfig {
  url?: string
  path?: string
  transports?: string[]
  autoConnect?: boolean
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
  /**
   * ✅ P6: максимальная задержка между попытками переподключения (мс).
   */
  reconnectionDelayMax?: number
  /**
   * ✅ P6: последовательный перебор транспортов при ошибке соединения.
   *
   * engine.io-client использует ТОЛЬКО transports[0] и переходит к следующему
   * транспорту только при tryAllTransports: true (_onError → transports.shift()).
   * Без этого флага fallback на polling не работает: при блокировке WebSocket
   * (корпоративный прокси, часть мобильных операторов) realtime не поднимется.
   *
   * По умолчанию включено.
   */
  tryAllTransports?: boolean
  /**
   * ✅ P2: таймаут ожидания ack-ответа в emit() (мс).
   * Защищает от «висящих» промисов, если сервер не вызывает ack-колбэк.
   */
  ackTimeout?: number
}

// ============================================
// КЛАСС SOCKET SERVICE
// ============================================
export class SocketService {
  private socket: Socket | null = null
  private currentBoardId: number | null = null
  private subscribedBoards = new Set<number>()
  private isConnected: boolean = false
  private config: Required<SocketServiceConfig>
  private isInitialized: boolean = false
  private eventHandlers = new Map<string, Set<SocketEventHandler>>()
  /**
   * ✅ P6: обёртки, повешенные на socket для событий из eventHandlers.
   *
   * Нужны, чтобы off() снимал ТОЛЬКО свой листенер и не задевал внутренние
   * обработчики из setupConnectionHandlers()/setupEventHandlers()
   * (раньше socket.off(event) снимал их все — например, внутренний
   * online-users:update, из-за чего список онлайна переставал обновляться).
   */
  private socketWrappers = new Map<string, SocketEventHandler>()
  /** ✅ P6: таймер планового переподключения после reconnect_failed */
  private fallbackReconnectTimer: ReturnType<typeof setTimeout> | null = null

  // ✅ Идентификатор сессии из session:initialized (используется для отладки/сессии).
  // Трекинг активности ведёт app/composables/useActivityTracker.ts — здесь он не дублируется.
  private sessionId: string | null = null

  constructor(config: SocketServiceConfig = {}) {
    this.config = {
      url: config.url || '',
      path: config.path || '/socket.io',
      transports: config.transports || ['websocket', 'polling'],
      autoConnect: config.autoConnect !== false,
      reconnection: config.reconnection !== false,
      reconnectionAttempts: config.reconnectionAttempts || 5,
      reconnectionDelay: config.reconnectionDelay || 1000,
      reconnectionDelayMax: config.reconnectionDelayMax || 5000,
      // ✅ P6: по умолчанию ВКЛ — иначе fallback на polling не работает вовсе
      tryAllTransports: config.tryAllTransports !== false,
      ackTimeout: config.ackTimeout || 10000
    }
  }

  // ============================================
  // ✅ ХЕЛПЕР: Извлечение чистого JWT из куки
  // ============================================
  private getJwtToken(): string | null {
    if (!process.client) return null

    try {
      const rawCookie = useCookie('auth_token').value
      if (!rawCookie) return null

      try {
        const parsed = JSON.parse(rawCookie)
        return parsed.token || null
      } catch {
        return rawCookie.length > 20 ? rawCookie : null
      }
    } catch (e) {
      console.warn('[SocketService] ❌ Ошибка чтения куки:', e)
    }

    try {
      const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/)
      const rawCookie = match?.[1] ? decodeURIComponent(match[1]) : null
      if (!rawCookie) return null

      try {
        const parsed = JSON.parse(rawCookie)
        return parsed.token || null
      } catch {
        return rawCookie.length > 20 ? rawCookie : null
      }
    } catch (e) {
      console.warn('[SocketService] ❌ Фолбэк парсинг также не сработал:', e)
      return null
    }
  }

  // ============================================
  // PUBLIC METHODS - Initialization
  // ============================================
  init(explicitToken?: string): void {
    if (!process.client) {
      console.log('[SocketService] ⚠️ Работа на сервере, пропускаем инициализацию')
      return
    }
    if (this.isInitialized) {
      console.log('[SocketService] ⚠️ Уже инициализирован')
      return
    }

    try {
      console.log('[SocketService] 🚀 Инициализация Socket.IO...')

      const isProd = process.env.NODE_ENV === 'production'
      const socketUrl = this.resolveSocketUrl(isProd)

      console.log(`[SocketService] 📍 Socket URL: ${socketUrl} (prod: ${isProd})`)

      const authToken = explicitToken || this.getJwtToken() || ''

      console.log('[SocketService] 🔑 Токен для инициализации (длина:', authToken?.length || 0, ')')

      this.socket = io(socketUrl, {
        path: this.config.path,
        transports: this.config.transports, // ✅ используем конфиг (P2.9)
        autoConnect: this.config.autoConnect,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        auth: authToken ? { token: authToken } : {},
        secure: window.location.protocol === 'https:',
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        timeout: 20000,
        // ✅ P6: реальный fallback websocket → polling
        // (engine.io по умолчанию использует только transports[0])
        tryAllTransports: this.config.tryAllTransports
      })

      this.setupConnectionHandlers()
      this.setupEventHandlers()
      this.isInitialized = true

      for (const event of this.eventHandlers.keys()) {
        // ✅ P6: регистрация через обёртку — чтобы off() мог снять только свой листенер
        this.attachSocketListener(event)
      }

      console.log('[SocketService] ✅ Socket.IO инициализирован')
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка инициализации:', error)
      throw error
    }
  }

  connect(explicitToken?: string): void {
    if (!this.socket) {
      this.init(explicitToken)
      return
    }

    if (!this.socket.connected) {
      const authToken = explicitToken || this.getJwtToken() || ''

      this.applyAuthToken(authToken)

      console.log('[SocketService] 🔑 Подключение с токеном (длина:', authToken?.length || 0, ')')
      this.socket.connect()
    }
    else if (explicitToken && this.socket.connected) {
      const authToken = explicitToken
      console.log('[SocketService] 🔄 Токен обновлён, переподключение...')

      this.socket.disconnect()
      this.applyAuthToken(authToken)

      setTimeout(() => {
        this.socket?.connect()
      }, 100)
    }
  }

  /**
   * ✅ P7: единый источник правды для адреса сокет-сервера.
   *
   * Раньше в dev-режиме здесь был жёстко зашит порт 3001, а сервер читал
   * `process.env.SOCKET_PORT` (server/socket/dev.ts) — рассинхрон приводил
   * к тихому `connect_error`. Теперь обе стороны берут значения из
   * runtimeConfig.public.socketUrl / runtimeConfig.public.socketPort
   * (см. nuxt.config.ts), которые можно переопределить переменными
   * NUXT_PUBLIC_SOCKET_URL / NUXT_PUBLIC_SOCKET_PORT.
   *
   * @param isProd — режим production
   */
  private resolveSocketUrl(isProd: boolean): string {
    let configuredUrl = ''
    let configuredPort = ''

    try {
      const runtimeConfig = useRuntimeConfig()
      configuredUrl = String(runtimeConfig?.public?.socketUrl || '').replace(/\/+$/, '')
      configuredPort = String(runtimeConfig?.public?.socketPort || '')
    } catch {
      // Вне контекста Nuxt (тесты, ранние вызовы) используем дефолты ниже
      console.warn('[SocketService] ⚠️ runtimeConfig недоступен, используем значения по умолчанию')
    }

    // 1. Явно заданный адрес сокет-сервера (в т.ч. внешний хост)
    if (configuredUrl) return configuredUrl

    // 2. Продакшен — тот же origin (nginx проксирует /socket.io/)
    if (isProd) return `${window.location.protocol}//${window.location.host}`

    // 3. Dev — отдельный сокет-сервер (порт общий с сервером, см. nuxt.config.ts)
    return `http://${window.location.hostname}:${configuredPort || '3001'}`
  }

  /**
   * ✅ P6: установить токен авторизации для следующих CONNECT-пакетов.
   *
   * ⚠️ ВАЖНО: socket.io-client копирует auth ПО ЗНАЧЕНИЮ при создании Socket
   * (socket.auth = opts.auth) и отправляет его в onopen() через
   * _sendConnectPacket(this.auth). Поэтому запись в io.opts.auth НЕ влияет
   * на хендшейк — обновлять нужно именно socket.auth (opts.auth держим
   * синхронно только для читаемости/отладки).
   */
  private applyAuthToken(authToken: string): void {
    if (!this.socket) return

    const auth = authToken ? { token: authToken } : {}

    try {
      this.socket.auth = auth
    } catch (error) {
      console.error('[SocketService] ❌ Не удалось обновить socket.auth:', error)
    }

    if (this.socket.io) {
      (this.socket.io.opts as any).auth = auth
    }
  }

  disconnect(): void {
    // ✅ P6: снимаем плановый реконнект до выхода
    this.clearFallbackReconnect()

    if (!this.socket) return
    console.log('[SocketService] 🔌 Отключение от сервера...')

    // ✅ P7: НЕ эмитим 'leave' перед закрытием — socket.disconnect() уничтожает
    // транспорт, поэтому пакеты всё равно не доставляются (раньше это давало
    // шумный лог «Отписка от всех досок» при каждом F5). Локальное состояние чистим.
    this.clearSubscriptions()
    this.socket.disconnect()
    this.socket = null
    this.socketWrappers.clear()
    this.isConnected = false
    this.isInitialized = false
  }

  // ============================================
  // PUBLIC METHODS - Event Handlers
  // ============================================
  on<T = any>(event: string, handler: SocketEventHandler<T>): void {
    // ✅ P1: серверу не нужны обработчики (защита singleton от роста)
    if (!process.client) return

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    const handlers = this.eventHandlers.get(event)!
    handlers.add(handler as SocketEventHandler)

    if (handlers.size === 1 && this.socket) {
      this.attachSocketListener(event)
    }
  }

  off<T = any>(event: string, handler?: SocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) return
    const handlers = this.eventHandlers.get(event)!
    if (handler) {
      handlers.delete(handler as SocketEventHandler)
    } else {
      handlers.clear()
    }
    if (handlers.size === 0) {
      // ✅ P6: снимаем ТОЛЬКО свою обёртку.
      // Раньше здесь был socket.off(event) — он снимал и внутренние листенеры
      // из setupConnectionHandlers()/setupEventHandlers() (например,
      // online-users:update), из-за чего обновления переставали доходить.
      this.detachSocketListener(event)
      this.eventHandlers.delete(event)
    }
  }

  /**
   * ✅ P2: список имён событий, которые эмитит Manager (socket.io), а не Socket.
   * Их нельзя подписывать на socket в init() — иначе останутся мёртвые листенеры.
   */
  private static readonly MANAGER_EVENTS = new Set([
    'reconnect_attempt',
    'reconnect',
    'reconnect_error',
    'reconnect_failed'
  ])

  /**
   * ✅ P2: ручная доставка события в обработчики, зарегистрированные через on()/useSocket().on().
   */
  private dispatch(event: string, payload?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (!handlers || handlers.size === 0) return
    for (const handler of handlers) handler(payload)
  }

  /**
   * ✅ P6: повесить на socket обёртку для события из eventHandlers.
   *
   * Обёртка сохраняется в socketWrappers, чтобы off() снимал именно её
   * и не задевал внутренние листенеры сервиса.
   */
  private attachSocketListener(event: string): void {
    if (!this.socket) return
    // ✅ P2: manager-события доставляются через dispatch() — на socket их вешать не нужно
    if (SocketService.MANAGER_EVENTS.has(event)) return
    if (this.socketWrappers.has(event)) return

    const handlers = this.eventHandlers.get(event)
    if (!handlers || handlers.size === 0) return

    const wrapper: SocketEventHandler = (data: any) => {
      for (const handler of handlers) handler(data)
    }

    this.socketWrappers.set(event, wrapper)
    this.socket.on(event, wrapper)
  }

  /**
   * ✅ P6: снять обёртку события (внутренние листенеры сервиса остаются на месте).
   */
  private detachSocketListener(event: string): void {
    const wrapper = this.socketWrappers.get(event)
    if (!wrapper) return

    this.socketWrappers.delete(event)
    this.socket?.off(event, wrapper)
  }

  /**
   * ✅ P6: пауза перед «вторым шансом» реконнекта после reconnect_failed (мс).
   *
   * С дефолтным бэкоффом 5 попыток (~17 c) socket.io-client прекращает попытки
   * и больше не восстанавливается сам — пользователю пришлось бы делать F5.
   */
  private static readonly FALLBACK_RECONNECT_DELAY = 15000

  /**
   * ✅ P6: запланировать полный перезапуск реконнекта после reconnect_failed.
   *
   * Останавливается в disconnect() (logout) и не срабатывает, если связь
   * уже восстановлена (или подключение подняли через window 'online').
   */
  private scheduleFallbackReconnect(): void {
    if (!process.client) return
    if (this.fallbackReconnectTimer) return

    this.fallbackReconnectTimer = setTimeout(() => {
      this.fallbackReconnectTimer = null

      if (!this.socket || this.socket.connected) return

      console.log('[SocketService] ♻️ Повторная попытка подключения после reconnect_failed...')
      this.socket.connect()
    }, SocketService.FALLBACK_RECONNECT_DELAY)
  }

  /**
   * ✅ P6: отменить запланированный реконнект.
   */
  private clearFallbackReconnect(): void {
    if (!this.fallbackReconnectTimer) return

    clearTimeout(this.fallbackReconnectTimer)
    this.fallbackReconnectTimer = null
  }

  /**
   * ✅ P2: Отправка события с ожиданием ack-ответа от сервера.
   *
   * ⚠️ Использовать ТОЛЬКО для событий, на которые сервер отвечает
   * ack-колбэком: `socket.on('event', (data, callback) => callback(...))`.
   * Для всех остальных событий используйте emitNoAck() — иначе промис
   * завершится только по таймауту (config.ackTimeout, по умолчанию 10 с).
   *
   * @param event Название события
   * @param data Данные события
   * @param timeoutMs Переопределение таймаута ожидания ack (мс)
   */
  async emit<T = any, R = any>(event: string, data?: T, timeoutMs?: number): Promise<R> {
    const timeout = timeoutMs ?? this.config.ackTimeout

    return new Promise<R>((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'))
        return
      }

      // ✅ P2: страховка от «висящего» промиса — сервер может не вызвать ack
      const timer = setTimeout(() => {
        reject(new Error(`Socket ack timeout (${timeout}ms) for "${event}"`))
      }, timeout)

      this.socket.emit(event, data, (response: R) => {
        clearTimeout(timer)
        resolve(response)
      })
    })
  }

  /**
   * ✅ P2: Отправка события без ожидания ack (fire-and-forget).
   *
   * Сервер обрабатывает событие и отвечает отдельным событием
   * (например `board:subscribed`, `heartbeat:ack`) или broadcast'ом.
   *
   * @returns true — событие отправлено, false — сокет недоступен/отключён
   */
  emitNoAck<T = any>(event: string, data?: T): boolean {
    if (!this.socket || !this.isConnected) {
      return false
    }

    this.socket.emit(event, data as any)
    return true
  }

  // ============================================
  // PUBLIC METHODS - Subscription Management
  // ============================================
  subscribeToBoard(boardId: number): void {
    if (!this.socket || !this.isConnected) {
      console.warn(`[SocketService] ⚠️ Нельзя подписаться на доску ${boardId}: не подключено`)
      return
    }
    if (this.subscribedBoards.has(boardId)) {
      console.log(`[SocketService] ⚠️ Уже подписано на доску ${boardId}`)
      return
    }
    const roomName = `board:${boardId}`
    console.log(`[SocketService] 📡 Подписка на комнату: ${roomName}`)
    this.socket.emit('join', roomName)
    this.subscribedBoards.add(boardId)
    this.currentBoardId = boardId
  }

  unsubscribeFromBoard(boardId: number): void {
    if (!this.socket) {
      console.warn(`[SocketService] ⚠️ Нельзя отписаться от доски ${boardId}: нет сокета`)
      return
    }
    if (!this.subscribedBoards.has(boardId)) {
      console.log(`[SocketService] ⚠️ Не подписано на доску ${boardId}`)
      return
    }
    const roomName = `board:${boardId}`
    console.log(`[SocketService] 📴 Отписка от комнаты: ${roomName}`)
    this.socket.emit('leave', roomName)
    this.subscribedBoards.delete(boardId)
    if (this.currentBoardId === boardId) {
      this.currentBoardId = null
    }
  }

  unsubscribeFromAll(): void {
    if (!this.socket) {
      this.clearSubscriptions()
      return
    }
    console.log(`[SocketService] 📴 Отписка от всех досок (${this.subscribedBoards.size})`)
    this.subscribedBoards.forEach(boardId => {
      const roomName = `board:${boardId}`
      this.socket?.emit('leave', roomName)
    })
    this.clearSubscriptions()
  }

  /**
   * ✅ P7: очистка локального состояния подписок без эмита 'leave'.
   * Используется при закрытии соединения (disconnect/logout/unload).
   */
  private clearSubscriptions(): void {
    this.subscribedBoards.clear()
    this.currentBoardId = null
  }

  // ============================================
  // PUBLIC METHODS - Utility
  // ============================================
  getConnected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  getSocketId(): string | undefined {
    return this.socket?.id
  }

  getTransport(): string {
    // ✅ P7: '—' — тот же sentinel, что ждёт UI (app/pages/cabinet/testpage.vue)
    return this.socket?.io?.engine?.transport?.name || '—'
  }

  getCurrentBoardId(): number | null {
    return this.currentBoardId
  }

  getSubscribedBoards(): number[] {
    return Array.from(this.subscribedBoards)
  }

  // ============================================
  // PRIVATE METHODS - Connection Handlers
  // ============================================
  private setupConnectionHandlers(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      this.isConnected = true
      console.log('[SocketService] ✅ Подключено:', this.socket?.id)
      const transport = this.getTransport()
      console.log('[SocketService] 🚚 Транспорт:', transport)
      if (transport === 'websocket') {
        console.log('[SocketService] ✅ WebSocket transport active - FAST MODE')
      } else {
        console.warn('[SocketService] ⚠️ Using polling transport - SLOW MODE')
      }
      this.socket?.io.engine.once('upgrade', (transport: any) => {
        console.log('[SocketService] 🚀 Transport upgraded to:', transport.name)
      })

      // Восстанавливаем подписки на доски после переподключения
      this.subscribedBoards.forEach(boardId => {
        this.socket?.emit('join', `board:${boardId}`)
      })

      // Авто-восстановление подписки на онлайн после переподключения
      import('stores/online').then(({ useOnlineStore }) => {
        const onlineStore = useOnlineStore()
        onlineStore.resubscribe()
      }).catch(() => {})
    })

    this.socket.on('disconnect', (reason: string) => {
      this.isConnected = false
      console.log('[SocketService] ❌ Отключено:', reason)

      if (reason !== 'io client disconnect') {
        console.log('[SocketService] 🔄 Соединение разорвано, пытаемся переподключиться...')
      }
    })

    this.socket.on('connect_error', (error: any) => {
      console.error('[SocketService] ⚠️ Ошибка подключения:', error.message)

      // ✅ P6: единая проверка невалидной авторизации
      // (см. services/helpers/socketAuthError.ts).
      // Сервер отдаёт локализованные статус-сообщения ('Неверный или истёкший токен',
      // 'Пользователь не найден', …), поэтому проверка английских строк не срабатывала.
      if (isInvalidSocketAuthError(error?.message)) {
        handleInvalidSocketAuth(error.message)
        return
      }

      // ✅ P6: если сервер отклонил CONNECT (middleware), socket.io-client
      // НЕ запускает автореконнект (destroy → Manager._close → skipReconnect) —
      // планируем повтор сами.
      this.scheduleFallbackReconnect()
    })

    this.socket.on('board:tasks:reordered', (data: {
      boardId: number
      status: string
      tasks: Array<{ id: number; order: number }>
    }) => {
      console.log('[SocketService] 📋 Tasks reordered:', data)
      this.handleTasksReordered(data)
    })

    this.socket.on('board:columns:reordered', (data: {
      boardId: number
      columns: Array<{ id: number; order: number }>
    }) => {
      console.log('[SocketService] 📋 Columns reordered:', data)
      this.handleColumnsReordered(data)
    })

    // ✅ P2: события реконнекта эмитит Manager (socket.io), а не Socket.
    // Пробрасываем их в зарегистрированные обработчики, чтобы стор видел reconnect_attempt/reconnect.
    const manager = this.socket.io

    manager.on('reconnect_attempt', (attempt: number) => {
      console.log(`[SocketService] 🔄 Попытка переподключения ${attempt}`)
      this.dispatch('reconnect_attempt', attempt)
    })

    manager.on('reconnect_error', (error: any) => {
      console.error('[SocketService] ⚠️ Ошибка переподключения:', error?.message)
      this.dispatch('reconnect_error', error)
    })

    manager.on('reconnect_failed', () => {
      console.error('[SocketService] ❌ Не удалось переподключиться после всех попыток')
      this.dispatch('reconnect_failed')
      // ✅ P6: не оставляем сокет мёртвым — планируем полный рестарт реконнекта
      this.scheduleFallbackReconnect()
    })

    manager.on('reconnect', (attempt: number) => {
      console.log('[SocketService] 🔄 Переподключено после', attempt, 'попыток')
      this.dispatch('reconnect', attempt)
    })
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    // ✅ P7: обработчик 'online-users:update' удалён — он дублировал подписку
    // stores/online.ts (subscribeToUpdates/resubscribe), из-за чего список
    // онлайна обновлялся дважды, а store инстанцировался на любой странице.
    // Источник правды — подписка самого store (OnlineWidget / cabinet/online).

    // События для задач
    this.socket.on('board:task:created', (data: { task: Task; boardId: number }) => {
      console.log('[SocketService] 🆕 Задача создана:', data.task.id, 'доска:', data.boardId)
      this.handleTaskCreated(data.task, data.boardId)
    })
    this.socket.on('board:task:updated', (data: { task: Task; boardId: number }) => {
      console.log('[SocketService] 🔄 Задача обновлена:', data.task.id, 'доска:', data.boardId)
      this.handleTaskUpdated(data.task, data.boardId)
    })
    this.socket.on('board:task:deleted', (data: { taskId: number; boardId: number }) => {
      console.log('[SocketService] 🗑️ Задача удалена:', data.taskId, 'доска:', data.boardId)
      this.handleTaskDeleted(data.taskId, data.boardId)
    })

    // События для подзадач
    this.socket.on('board:subtask:created', (data: { subtask: Subtask; boardId: number }) => {
      console.log('[SocketService] 🆕 Подзадача создана:', data.subtask.id, 'доска:', data.boardId)
      this.handleSubtaskCreated(data.subtask, data.boardId)
    })
    this.socket.on('board:subtask:updated', (data: { subtask: Subtask; boardId: number }) => {
      console.log('[SocketService] 🔄 Подзадача обновлена:', data.subtask.id, 'доска:', data.boardId)
      this.handleSubtaskUpdated(data.subtask, data.boardId)
    })
    this.socket.on('board:subtask:deleted', (data: {
      subtaskId: number
      taskId: number
      boardId: number
    }) => {
      console.log('[SocketService] 🗑️ Подзадача удалена:', data.subtaskId, 'задача:', data.taskId, 'доска:', data.boardId)
      this.handleSubtaskDeleted(data.subtaskId, data.taskId, data.boardId)
    })

    // События для колонок
    this.socket.on('board:column:created', (data: { column: BoardColumn; boardId: number }) => {
      console.log('[SocketService] 🆕 Колонка создана:', data.column.id, 'доска:', data.boardId)
      this.handleColumnCreated(data.column, data.boardId)
    })
    this.socket.on('board:column:updated', (data: { column: BoardColumn; boardId: number }) => {
      console.log('[SocketService] 🔄 Колонка обновлена:', data.column.id, 'доска:', data.boardId)
      this.handleColumnUpdated(data.column, data.boardId)
    })
    this.socket.on('board:column:deleted', (data: { columnId: number; boardId: number }) => {
      console.log('[SocketService] 🗑️ Колонка удалена:', data.columnId, 'доска:', data.boardId)
      this.handleColumnDeleted(data.columnId, data.boardId)
    })

    // События сессии
    this.socket.on('session:initialized', (data: { sessionId: string; userId: number }) => {
      console.log('[SocketService] 🎫 Сессия инициализирована:', data.sessionId)
      this.handleSessionInitialized(data)
    })

    // Ошибки
    this.socket.on('error', (error: any) => {
      console.error('[SocketService] ❌ Ошибка сервера:', error)
    })
  }

  // ============================================
  // PRIVATE METHODS - Event Handlers (Tasks)
  // ============================================
  private handleTaskCreated(task: Task, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/tasks').then(({ useTasksStore }) => {
        const tasksStore = useTasksStore()
        tasksStore.handleTaskCreated(task)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки task:created:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта tasksStore:', error)
    }
  }

  private handleTaskUpdated(task: Task, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/tasks').then(({ useTasksStore }) => {
        const tasksStore = useTasksStore()
        tasksStore.handleTaskUpdated(task)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки task:updated:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта tasksStore:', error)
    }
  }

  private handleTaskDeleted(taskId: number, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/tasks').then(({ useTasksStore }) => {
        const tasksStore = useTasksStore()
        tasksStore.handleTaskDeleted(taskId)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки task:deleted:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта tasksStore:', error)
    }
  }

  // ============================================
  // PRIVATE METHODS - Event Handlers (Subtasks)
  // ============================================
  private handleSubtaskCreated(subtask: Subtask, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/subtasks').then(({ useSubtasksStore }) => {
        const subtasksStore = useSubtasksStore()
        subtasksStore.handleSubtaskCreated(subtask)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки subtask:created:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта subtasksStore:', error)
    }
  }

  private handleSubtaskUpdated(subtask: Subtask, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/subtasks').then(({ useSubtasksStore }) => {
        const subtasksStore = useSubtasksStore()
        subtasksStore.handleSubtaskUpdated(subtask)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки subtask:updated:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта subtasksStore:', error)
    }
  }

  private handleSubtaskDeleted(subtaskId: number, taskId: number, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/subtasks').then(({ useSubtasksStore }) => {
        const subtasksStore = useSubtasksStore()
        subtasksStore.handleSubtaskDeleted(subtaskId, taskId)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки subtask:deleted:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта subtasksStore:', error)
    }
  }

  // ============================================
  // PRIVATE METHODS - Event Handlers (Columns)
  // ============================================
  private handleColumnCreated(column: BoardColumn, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/columns').then(({ useColumnsStore }) => {
        const columnsStore = useColumnsStore()
        columnsStore.handleColumnCreated(column)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки column:created:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта columnsStore:', error)
    }
  }

  private handleColumnUpdated(column: BoardColumn, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/columns').then(({ useColumnsStore }) => {
        const columnsStore = useColumnsStore()
        columnsStore.handleColumnUpdated(column)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки column:updated:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта columnsStore:', error)
    }
  }

  private handleColumnDeleted(columnId: number, boardId: number): void {
    if (!process.client) return
    try {
      import('stores/boards/columns').then(({ useColumnsStore }) => {
        const columnsStore = useColumnsStore()
        columnsStore.handleColumnDeleted(columnId)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки column:deleted:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта columnsStore:', error)
    }
  }

  private handleTasksReordered(data: {
    boardId: number
    status: string
    tasks: Array<{ id: number; order: number }>
  }): void {
    if (!process.client) return
    try {
      import('stores/boards/tasks').then(({ useTasksStore }) => {
        const tasksStore = useTasksStore()
        tasksStore.handleTasksReordered(data)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки tasks:reordered:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта tasksStore:', error)
    }
  }

  private handleColumnsReordered(data: {
    boardId: number
    columns: Array<{ id: number; order: number }>
  }): void {
    if (!process.client) return
    try {
      import('stores/boards/columns').then(({ useColumnsStore }) => {
        const columnsStore = useColumnsStore()
        columnsStore.handleColumnsReordered(data)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка обработки columns:reordered:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта columnsStore:', error)
    }
  }

  private handleSessionInitialized(data: { sessionId: string; userId: number }): void {
    if (!process.client) return
    try {
      // ✅ P7: единственный владелец записи cookie session_id — stores/socket
      // (stores/socket/index.ts, обработчик 'session:initialized'). Здесь только
      // кэшируем значение для отладки, чтобы не дублировать запись в cookie.
      this.sessionId = data.sessionId
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка сохранения session_id:', error)
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
export const socketService = new SocketService({
  path: '/socket.io',
  transports: ['websocket', 'polling'], // ✅ WebSocket первым (P2.9)
  // ✅ P6: без tryAllTransports engine.io использует ТОЛЬКО transports[0]='websocket'
  // и никогда не переходит на polling (см. SocketServiceConfig)
  tryAllTransports: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  // ✅ P6: ограничение бэкоффа реконнекта
  reconnectionDelayMax: 5000
})

// ============================================
// COMPOSABLE ДЛЯ ИСПОЛЬЗОВАНИЯ В КОМПОНЕНТАХ
// ============================================
export function useSocket() {
  const init = () => socketService.init()
  const connect = (token?: string) => socketService.connect(token)
  const disconnect = () => socketService.disconnect()
  const on = <T = any>(event: string, handler: (data: T) => void) => socketService.on(event, handler)
  const off = <T = any>(event: string, handler?: (data: T) => void) => socketService.off(event, handler)
  const emit = <T = any, R = any>(event: string, data?: T, timeoutMs?: number): Promise<R> => socketService.emit(event, data, timeoutMs)
  const emitNoAck = <T = any>(event: string, data?: T): boolean => socketService.emitNoAck(event, data)
  const subscribeToBoard = (boardId: number) => socketService.subscribeToBoard(boardId)
  const unsubscribeFromBoard = (boardId: number) => socketService.unsubscribeFromBoard(boardId)
  const unsubscribeFromAll = () => socketService.unsubscribeFromAll()
  const isConnected = () => socketService.getConnected()
  const getSocketId = () => socketService.getSocketId()
  const getCurrentBoardId = () => socketService.getCurrentBoardId()
  const getSubscribedBoards = () => socketService.getSubscribedBoards()

  return {
    init, connect, disconnect, on, off, emit, emitNoAck,
    subscribeToBoard, unsubscribeFromBoard, unsubscribeFromAll,
    isConnected, getSocketId, getCurrentBoardId, getSubscribedBoards
  }
}
