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
 */
import { io, type Socket } from 'socket.io-client'
import { useCookie } from '#app'
import type { Subtask, Task, BoardColumn } from '~/types/boards'
import { useAuthStore } from 'stores/auth'
import { setSessionId } from 'services/helpers/sessionId'

// ============================================
// ТИПЫ СОБЫТИЙ
// ============================================
/**
 * Типы для обработчиков событий
 */
type SocketEventHandler<T = any> = (data: T) => void

/**
 * Карта зарегистрированных обработчиков событий
 */
interface EventHandlerMap {
  // ============================================
  // СОБЫТИЯ ПОДКЛЮЧЕНИЯ
  // ============================================
  'connect': SocketEventHandler
  'disconnect': SocketEventHandler<string>
  'connect_error': SocketEventHandler<any>
  'reconnect_attempt': SocketEventHandler<number>
  'reconnect': SocketEventHandler<number>
  'reconnect_failed': SocketEventHandler
  'error': SocketEventHandler<any>
  
  // ============================================
  // СОБЫТИЯ СЕССИИ
  // ============================================
  'session:initialized': SocketEventHandler<{ sessionId: string; userId: number }>
  
  // ============================================
  // СОБЫТИЯ ВКЛАДОК
  // ============================================
  'tab:registered': SocketEventHandler<{ tabId: string; currentPath: string }>
  'board:subscribed': SocketEventHandler<{ boardId: number; success: boolean }>
  'board:unsubscribed': SocketEventHandler<{ success: boolean }>
  
  // ============================================
  // СОБЫТИЯ ЗАДАЧ
  // ============================================
  'board:task:created': SocketEventHandler<{ task: Task; boardId: number }>
  'board:task:updated': SocketEventHandler<{ task: Task; boardId: number }>
  'board:task:deleted': SocketEventHandler<{ taskId: number; boardId: number }>
  'board:tasks:reordered': SocketEventHandler<{
    boardId: number
    status: string
    tasks: Array<{ id: number; order: number }>
  }>
  
  // ============================================
  // СОБЫТИЯ ПОДЗАДАЧ
  // ============================================
  'board:subtask:created': SocketEventHandler<{ subtask: Subtask; boardId: number }>
  'board:subtask:updated': SocketEventHandler<{ subtask: Subtask; boardId: number }>
  'board:subtask:deleted': SocketEventHandler<{
    subtaskId: number
    taskId: number
    boardId: number
  }>
  
  // ============================================
  // ✅ СОБЫТИЯ КОЛОНОК (НОВОЕ)
  // ============================================
  'board:column:created': SocketEventHandler<{ column: BoardColumn; boardId: number }>
  'board:column:updated': SocketEventHandler<{ column: BoardColumn; boardId: number }>
  'board:column:deleted': SocketEventHandler<{ columnId: number; boardId: number }>
  'board:columns:reordered': SocketEventHandler<{
    boardId: number
    columns: Array<{ id: number; order: number }>
  }>
  
  // ============================================
  // ДИНАМИЧЕСКИЕ СОБЫТИЯ
  // ============================================
  [key: string]: SocketEventHandler
}

// ============================================
// КОНФИГУРАЦИЯ
// ============================================
interface SocketServiceConfig {
  /**
   * URL сокет-сервера
   */
  url?: string
  /**
   * Путь к socket.io
   */
  path?: string
  /**
   * Транспортные протоколы
   */
  transports?: string[]
  /**
   * Автоматическое подключение
   */
  autoConnect?: boolean
  /**
   * Переподключение при разрыве
   */
  reconnection?: boolean
  /**
   * Максимальное количество попыток переподключения
   */
  reconnectionAttempts?: number
  /**
   * Задержка между попытками переподключения (мс)
   */
  reconnectionDelay?: number
}

// ============================================
// КЛАСС SOCKET SERVICE
// ============================================
export class SocketService {
  /**
   * Экземпляр сокет-подключения
   */
  private socket: Socket | null = null
  
  /**
   * ID текущей подписанной доски
   */
  private currentBoardId: number | null = null
  
  /**
   * Множество ID досок, на которые подписаны
   */
  private subscribedBoards = new Set<number>()
  
  /**
   * Статус подключения
   */
  private isConnected: boolean = false
  
  /**
   * Конфигурация сервиса
   */
  private config: Required<SocketServiceConfig>
  
  /**
   * Флаг инициализации
   */
  private isInitialized: boolean = false
  
  /**
   * Карта зарегистрированных обработчиков событий
   */
  private eventHandlers = new Map<string, Set<SocketEventHandler>>()
  
  constructor(config: SocketServiceConfig = {}) {
    // Значения по умолчанию
    this.config = {
      url: config.url || '',
      path: config.path || '/socket.io',
      transports: config.transports || ['websocket', 'polling'],
      autoConnect: config.autoConnect !== false,
      reconnection: config.reconnection !== false,
      reconnectionAttempts: config.reconnectionAttempts || 5,
      reconnectionDelay: config.reconnectionDelay || 1000
    }
  }
  
  // ============================================
  // PUBLIC METHODS - Initialization
  // ============================================
  /**
   * Инициализация сокет-сервиса
   * Вызывается один раз при старте приложения
   */
  init(): void {
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
      
      // ✅ ПРАВИЛЬНОЕ ОПРЕДЕЛЕНИЕ ПРОДАКШЕНА
      const isProd = process.env.NODE_ENV === 'production'
      
      // Формируем URL — В ПРОДАКШЕНЕ ВСЕГДА ОДИН ПОРТ (3000)
      const socketUrl = isProd
        ? `${window.location.protocol}//${window.location.host}`
        : `http://${window.location.hostname}:3001`
      
      console.log(`[SocketService] 📍 Socket URL: ${socketUrl} (prod: ${isProd})`)
      
      const authToken = useCookie('auth_token')?.value || ''
      
      this.socket = io(socketUrl, {
        path: this.config.path,
        // 🔥 ТРАНСПОРТЫ: polling первым (гарантированно работает)
        transports: ['polling', 'websocket'],
        // Стандартные настройки
        autoConnect: this.config.autoConnect,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        // Аутентификация
        auth: { token: authToken },
        // 🔐 Безопасность
        secure: window.location.protocol === 'https:',
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        // 🔥 Таймауты
        timeout: 20000
      })
      
      this.setupConnectionHandlers()
      this.setupEventHandlers()
      this.isInitialized = true

      // ✅ Навешиваем хендлеры из eventHandlers, накопленные до init()
      for (const [event, handlers] of this.eventHandlers.entries()) {
        if (handlers.size > 0) {
          this.socket!.on(event, (data: any) => {
            for (const h of handlers) h(data)
          })
        }
      }
      
      console.log('[SocketService] ✅ Socket.IO инициализирован')
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка инициализации:', error)
      throw error
    }
  }
  
  /**
   * Подключиться к серверу (если не подключено)
   */
  connect(): void {
    if (!this.socket) {
      this.init()
    } else if (!this.socket.connected) {
      this.socket.connect()
    }
  }
  
  /**
   * Отключиться от сервера
   */
  disconnect(): void {
    if (!this.socket) return
    
    console.log('[SocketService] 🔌 Отключение от сервера...')
    this.unsubscribeFromAll()
    this.socket.disconnect()
    this.socket = null
    this.isConnected = false
    this.isInitialized = false
  }
  
  // ============================================
  // PUBLIC METHODS - Event Handlers
  // ============================================
  /**
   * Подписаться на событие
   */
  on<T = any>(event: string, handler: SocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    const handlers = this.eventHandlers.get(event)!
    handlers.add(handler as SocketEventHandler)
    
    // Регистрируем в сокете только один раз
    if (handlers.size === 1 && this.socket) {
      this.socket.on(event, (data: T) => {
        for (const h of handlers) {
          h(data)
        }
      })
    }
  }
  
  /**
   * Отписаться от события
   */
  off<T = any>(event: string, handler?: SocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) return
    
    const handlers = this.eventHandlers.get(event)!
    if (handler) {
      handlers.delete(handler as SocketEventHandler)
    } else {
      handlers.clear()
    }
    
    // Если нет обработчиков - отписываемся от сокета
    if (handlers.size === 0 && this.socket) {
      this.socket.off(event)
      this.eventHandlers.delete(event)
    }
  }
  
  /**
   * Отправить событие на сервер
   */
  async emit<T = any, R = any>(event: string, data?: T): Promise<R> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Socket not connected'))
        return
      }
      this.socket.emit(event, data, (response: R) => {
        resolve(response)
      })
    })
  }
  
  // ============================================
  // PUBLIC METHODS - Subscription Management
  // ============================================
  /**
   * Подписаться на обновления доски
   * @param boardId - ID доски для подписки
   */
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
  
  /**
   * Отписаться от обновлений доски
   * @param boardId - ID доски для отписки
   */
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
    
    // Сбрасываем currentBoardId если отписались от текущей
    if (this.currentBoardId === boardId) {
      this.currentBoardId = null
    }
  }
  
  /**
   * Отписаться от всех досок
   */
  unsubscribeFromAll(): void {
    if (!this.socket) return
    
    console.log(`[SocketService] 📴 Отписка от всех досок (${this.subscribedBoards.size})`)
    
    this.subscribedBoards.forEach(boardId => {
      const roomName = `board:${boardId}`
      this.socket?.emit('leave', roomName)
    })
    
    this.subscribedBoards.clear()
    this.currentBoardId = null
  }
  
  // ============================================
  // PUBLIC METHODS - Utility
  // ============================================
  /**
   * Проверка статуса подключения
   */
  getConnected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }
  
  /**
   * Получить ID сокета
   */
  getSocketId(): string | undefined {
    return this.socket?.id
  }
  
  /**
   * Получить текущий транспорт
   */
  getTransport(): string {
    return this.socket?.io?.engine?.transport?.name || 'unknown'
  }
  
  /**
   * Получить ID текущей доски
   */
  getCurrentBoardId(): number | null {
    return this.currentBoardId
  }
  
  /**
   * Получить список подписанных досок
   */
  getSubscribedBoards(): number[] {
    return Array.from(this.subscribedBoards)
  }
  
  // ============================================
  // PRIVATE METHODS - Connection Handlers
  // ============================================
  /**
   * Настройка обработчиков событий подключения
   */
  private setupConnectionHandlers(): void {
    if (!this.socket) return
    
    // ✅ Подключено
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
      
      // ✅ Слушаем upgrade ПОСЛЕ подключения — engine уже доступен
      this.socket?.io.engine.once('upgrade', (transport: any) => {
        console.log('[SocketService] 🚀 Transport upgraded to:', transport.name)
      })
      
      // ✅ Восстанавливаем подписки на доски после переподключения
      this.subscribedBoards.forEach(boardId => {
        this.socket?.emit('join', `board:${boardId}`)
      })
    })
    
    // ❌ Отключено
    this.socket.on('disconnect', (reason: string) => {
      this.isConnected = false
      console.log('[SocketService] ❌ Отключено:', reason)
      
      // Если разрыв не по нашей инициативе - пробуем переподключиться
      if (reason !== 'io client disconnect') {
        console.log('[SocketService] 🔄 Соединение разорвано, пытаемся переподключиться...')
      }
    })
    
    // ⚠️ Ошибка подключения
    this.socket.on('connect_error', (error: any) => {
      console.error('[SocketService] ⚠️ Ошибка подключения:', error.message)
      
      // ✅ logout только при невалидном токене, но НЕ при его отсутствии
      const isInvalidToken =
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Invalid token') ||
        error.message?.includes('User not found')
      
      if (isInvalidToken) {
        console.log('[SocketService] 🔐 Невалидный токен, выполняем выход...')
        if (process.client) {
          const authStore = useAuthStore()
          authStore.logout()
        }
      }
    })
    
    // ✅ Обработчик изменения порядка задач
    this.socket.on('board:tasks:reordered', (data: {
      boardId: number
      status: string
      tasks: Array<{ id: number; order: number }>
    }) => {
      console.log('[SocketService] 📋 Tasks reordered:', data)
      this.handleTasksReordered(data)
    })
    
    // ✅ ОБРАБОТЧИК ИЗМЕНЕНИЯ ПОРЯДКА КОЛОНОК (НОВОЕ)
    this.socket.on('board:columns:reordered', (data: {
      boardId: number
      columns: Array<{ id: number; order: number }>
    }) => {
      console.log('[SocketService] 📋 Columns reordered:', data)
      this.handleColumnsReordered(data)
    })
    
    // 🔄 Переподключено
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('[SocketService] 🔄 Переподключено после', attemptNumber, 'попыток')
    })
    
    // ⚠️ Ошибка переподключения
    this.socket.on('reconnect_error', (error: any) => {
      console.error('[SocketService] ⚠️ Ошибка переподключения:', error.message)
    })
    
    // ❌ Неудачное переподключение
    this.socket.on('reconnect_failed', () => {
      console.error('[SocketService] ❌ Не удалось переподключиться после всех попыток')
    })
    
    // ✅ Попытка переподключения
    this.socket.io.on('reconnect_attempt', (attempt: number) => {
      console.log(`[SocketService] 🔄 Попытка переподключения ${attempt}`)
    })
  }
  
  /**
   * Настройка обработчиков бизнес-событий
   */
  private setupEventHandlers(): void {
    if (!this.socket) return
    
    // ============================================
    // СОБЫТИЯ ДЛЯ ЗАДАЧ
    // ============================================
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
    
    // ============================================
    // СОБЫТИЯ ДЛЯ ПОДЗАДАЧ
    // ============================================
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
    
    // ============================================
    // ✅ СОБЫТИЯ ДЛЯ КОЛОНОК (НОВОЕ)
    // ============================================
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
    
    // ============================================
    // СОБЫТИЯ СЕССИИ
    // ============================================
    this.socket.on('session:initialized', (data: { sessionId: string; userId: number }) => {
      console.log('[SocketService] 🎫 Сессия инициализирована:', data.sessionId)
      this.handleSessionInitialized(data)
    })
    
    // ============================================
    // ОШИБКИ
    // ============================================
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
  // ✅ PRIVATE METHODS - Event Handlers (Columns)
  // ============================================
  /**
   * Обработка события создания колонки
   */
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
  
  /**
   * Обработка события обновления колонки
   */
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
  
  /**
   * Обработка события удаления колонки
   */
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
  
  /**
   * Обработчик события изменения порядка задач
   */
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
  
  /**
   * ✅ ОБРАБОТЧИК СОБЫТИЯ ИЗМЕНЕНИЯ ПОРЯДКА КОЛОНОК (НОВОЕ)
   * 📡 Вызывается из SocketService при reorder колонок
   */
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
  
  // ============================================
  // PRIVATE METHODS - Session Handlers
  // ============================================
  /**
   * Обработка инициализации сессии
   */
  private handleSessionInitialized(data: { sessionId: string; userId: number }): void {
    if (!process.client) return
    try {
      setSessionId(data.sessionId) // прямой вызов
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка сохранения session_id:', error)
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================
/**
 * Единственный экземпляр сервиса
 * Используется во всём приложении
 */
export const socketService = new SocketService({
  path: '/socket.io',
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

// ============================================
// COMPOSABLE ДЛЯ ИСПОЛЬЗОВАНИЯ В КОМПОНЕНТАХ
// ============================================
/**
 * Composable для удобного использования socketService в компонентах
 *
 * @example
 * ```ts
 * const { subscribeToBoard, unsubscribeFromBoard } = useSocket()
 *
 * onMounted(() => {
 *   subscribeToBoard(boardId.value)
 * })
 *
 * onUnmounted(() => {
 *   unsubscribeFromBoard(boardId.value)
 * })
 * ```
 */
export function useSocket() {
  const init = () => {
    socketService.init()
  }
  
  const connect = () => {
    socketService.connect()
  }
  
  const disconnect = () => {
    socketService.disconnect()
  }
  
  const on = <T = any>(event: string, handler: (data: T) => void) => {
    socketService.on(event, handler)
  }
  
  const off = <T = any>(event: string, handler?: (data: T) => void) => {
    socketService.off(event, handler)
  }
  
  const emit = <T = any, R = any>(event: string, data?: T): Promise<R> => {
    return socketService.emit(event, data)
  }
  
  const subscribeToBoard = (boardId: number) => {
    socketService.subscribeToBoard(boardId)
  }
  
  const unsubscribeFromBoard = (boardId: number) => {
    socketService.unsubscribeFromBoard(boardId)
  }
  
  const unsubscribeFromAll = () => {
    socketService.unsubscribeFromAll()
  }
  
  const isConnected = () => {
    return socketService.getConnected()
  }
  
  const getSocketId = () => {
    return socketService.getSocketId()
  }
  
  const getCurrentBoardId = () => {
    return socketService.getCurrentBoardId()
  }
  
  const getSubscribedBoards = () => {
    return socketService.getSubscribedBoards()
  }
  
  return {
    init,
    connect,
    disconnect,
    on,
    off,
    emit,
    subscribeToBoard,
    unsubscribeFromBoard,
    unsubscribeFromAll,
    isConnected,
    getSocketId,
    getCurrentBoardId,
    getSubscribedBoards
  }
}
