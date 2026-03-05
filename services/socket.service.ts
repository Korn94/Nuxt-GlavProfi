// services/socket.service.ts
/**
 * Централизованный сервис для работы с Socket.IO
 * 
 * Архитектура:
 * - Единая точка подключения к сокет-серверу
 * - Подписка на комнаты досок (board:{boardId})
 * - Обработка всех socket-событий (tasks, subtasks, etc.)
 * - Интеграция с Pinia stores
 * - Клиент-сайдовый только (process.client)
 */

import { io, type Socket } from 'socket.io-client'
import { useCookie } from '#app'
import type { Subtask, Task } from '~/types/boards'

// ============================================
// ТИПЫ СОБЫТИЙ
// ============================================

/**
 * Типы для обработчиков событий
 */
type SocketEventHandler<T = any> = (data: T) => void

/**
 * Карта зарегистрированных обработчиков
 */
interface EventHandlerMap {
  'connect': SocketEventHandler
  'disconnect': SocketEventHandler<string>
  'connect_error': SocketEventHandler<any>
  'reconnect_attempt': SocketEventHandler<number>
  'reconnect': SocketEventHandler<number>
  'reconnect_failed': SocketEventHandler
  'error': SocketEventHandler<any>
  'session:initialized': SocketEventHandler<{ sessionId: string; userId: number }>
  'board:subtask:created': SocketEventHandler<{ subtask: Subtask; boardId: number }>
  'board:subtask:updated': SocketEventHandler<{ subtask: Subtask; boardId: number }>
  'board:subtask:deleted': SocketEventHandler<{ subtaskId: number; taskId: number; boardId: number }>
  'board:task:created': SocketEventHandler<{ task: Task; boardId: number }>
  'board:task:updated': SocketEventHandler<{ task: Task; boardId: number }>
  'board:task:deleted': SocketEventHandler<{ taskId: number; boardId: number }>
  'board:subscribed': SocketEventHandler<{ boardId: number; success: boolean }>
  'board:unsubscribed': SocketEventHandler<{ success: boolean }>
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
    // ⛔ Работаем только на клиенте
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
      
      // ✅ Правильный URL для подключения
      const socketUrl = process.client 
        ? (window.location.hostname === 'localhost' 
            ? 'http://localhost:3001'
            : `http://${window.location.hostname}:3001`)
        : ''
      
      // ✅ ПОЛУЧАЕМ ТОКЕН ИЗ COOKIE
      const authToken = useCookie('auth_token')?.value || ''
      
      // Создаём подключение с передачей токена
      this.socket = io(socketUrl, {
        path: this.config.path,
        transports: this.config.transports,
        autoConnect: this.config.autoConnect,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        // ✅ ПЕРЕДАЁМ ТОКЕН В AUTH
        auth: {
          token: authToken // ✅ КРИТИЧЕСКИ ВАЖНО
        }
      })
      
      // Регистрируем обработчики событий подключения
      this.setupConnectionHandlers()
      
      // Регистрируем обработчики бизнес-событий
      this.setupEventHandlers()
      
      this.isInitialized = true
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
      
      // Проверяем транспорт
      const transport = this.getTransport()
      console.log('[SocketService] 🚚 Транспорт:', transport)
      
      if (transport === 'websocket') {
        console.log('[SocketService] ✅ WebSocket transport active - FAST MODE')
      } else {
        console.warn('[SocketService] ⚠️ Using polling transport - SLOW MODE')
      }
      
      // Переподписываемся на доски после reconnect
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
      
      // Автоматический выход при ошибке аутентификации
      if (error.message?.includes('Unauthorized') || error.message?.includes('No token')) {
        console.log('[SocketService] 🔐 Ошибка аутентификации, выполняем выход...')
        
        // Динамический импорт для избежания циклических зависимостей
        if (process.client) {
          import('stores/auth').then(({ useAuthStore }) => {
            const authStore = useAuthStore()
            authStore.logout()
          }).catch(err => {
            console.error('[SocketService] ❌ Не удалось импортировать auth store:', err)
          })
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
    
    this.socket.on('board:subtask:deleted', (data: { subtaskId: number; taskId: number; boardId: number }) => {
      console.log('[SocketService] 🗑️ Подзадача удалена:', data.subtaskId, 'задача:', data.taskId, 'доска:', data.boardId)
      this.handleSubtaskDeleted(data.subtaskId, data.taskId, data.boardId)
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
  // PRIVATE METHODS - Event Handlers
  // ============================================
  
  /**
   * Обработка события создания задачи
   */
  private handleTaskCreated(task: Task, boardId: number): void {
    if (!process.client) return
    
    try {
      // Динамический импорт store
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
  
  /**
   * Обработка события обновления задачи
   */
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
  
  /**
   * Обработка события удаления задачи
   */
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
  
  /**
   * Обработка события создания подзадачи
   */
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
  
  /**
   * Обработка события обновления подзадачи
   */
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
  
  /**
   * Обработка события удаления подзадачи
   */
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
   * Обработка инициализации сессии
   */
  private handleSessionInitialized(data: { sessionId: string; userId: number }): void {
    if (!process.client) return
    
    // Сохраняем session_id в cookie
    try {
      import('./helpers/sessionId').then(({ setSessionId }) => {
        setSessionId(data.sessionId)
      }).catch(error => {
        console.error('[SocketService] ❌ Ошибка сохранения session_id:', error)
      })
    } catch (error) {
      console.error('[SocketService] ❌ Ошибка импорта setSessionId:', error)
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
  transports: ['websocket', 'polling'],
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
  /**
   * Инициализировать сервис
   */
  const init = () => {
    socketService.init()
  }
  
  /**
   * Подключиться к серверу
   */
  const connect = () => {
    socketService.connect()
  }
  
  /**
   * Отключиться от сервера
   */
  const disconnect = () => {
    socketService.disconnect()
  }
  
  /**
   * Подписаться на событие
   */
  const on = <T = any>(event: string, handler: (data: T) => void) => {
    socketService.on(event, handler)
  }
  
  /**
   * Отписаться от события
   */
  const off = <T = any>(event: string, handler?: (data: T) => void) => {
    socketService.off(event, handler)
  }
  
  /**
   * Отправить событие
   */
  const emit = <T = any, R = any>(event: string, data?: T): Promise<R> => {
    return socketService.emit(event, data)
  }
  
  /**
   * Подписаться на доску
   */
  const subscribeToBoard = (boardId: number) => {
    socketService.subscribeToBoard(boardId)
  }
  
  /**
   * Отписаться от доски
   */
  const unsubscribeFromBoard = (boardId: number) => {
    socketService.unsubscribeFromBoard(boardId)
  }
  
  /**
   * Отписаться от всех досок
   */
  const unsubscribeFromAll = () => {
    socketService.unsubscribeFromAll()
  }
  
  /**
   * Проверить статус подключения
   */
  const isConnected = () => {
    return socketService.getConnected()
  }
  
  /**
   * Получить ID сокета
   */
  const getSocketId = () => {
    return socketService.getSocketId()
  }
  
  /**
   * Получить ID текущей доски
   */
  const getCurrentBoardId = () => {
    return socketService.getCurrentBoardId()
  }
  
  /**
   * Получить список подписанных досок
   */
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
