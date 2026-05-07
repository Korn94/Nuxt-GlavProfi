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
 */

import { io, type Socket } from 'socket.io-client'
import { useCookie } from '#app'
import type { Subtask, Task, BoardColumn } from '~/types/boards'
import { setSessionId } from 'services/helpers/sessionId'

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

  constructor(config: SocketServiceConfig = {}) {
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
  // ✅ ХЕЛПЕР: Извлечение чистого JWT из куки
  // ============================================
  /**
   * Безопасно извлекает токен из куки, поддерживая старый и новый формат.
   * Новый формат: JSON { token, userId, role }
   * Старый формат: просто строка JWT
   */
  private getJwtToken(): string | null {
    if (!process.client) return null

    // Способ 1: через useCookie (надёжнее, чем document.cookie)
    try {
      const rawCookie = useCookie('auth_token').value
      if (!rawCookie) return null

      // Новый формат: JSON { token, userId, role }
      try {
        const parsed = JSON.parse(rawCookie)
        return parsed.token || null
      } catch {
        // Старый формат: просто строка
        return rawCookie.length > 20 ? rawCookie : null
      }
    } catch (e) {
      console.warn('[SocketService] ❌ Ошибка чтения куки:', e)
    }

    // Фолбэк: document.cookie (если useCookie не сработал)
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
      const socketUrl = isProd
        ? `${window.location.protocol}//${window.location.host}`
        : `http://${window.location.hostname}:3001`

      console.log(`[SocketService] 📍 Socket URL: ${socketUrl} (prod: ${isProd})`)

      // ✅ Используем хелпер для извлечения чистого JWT, или явный токен
      const authToken = explicitToken || this.getJwtToken() || ''

      console.log('[SocketService] 🔑 Токен для инициализации (длина:', authToken?.length || 0, ')')

      this.socket = io(socketUrl, {
        path: this.config.path,
        transports: ['polling', 'websocket'],
        autoConnect: this.config.autoConnect,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
        // ✅ Передаём только чистый JWT
        auth: authToken ? { token: authToken } : {},
        secure: window.location.protocol === 'https:',
        rejectUnauthorized: process.env.NODE_ENV === 'production',
        timeout: 20000
      })

      this.setupConnectionHandlers()
      this.setupEventHandlers()
      this.isInitialized = true

      // Навешиваем хендлеры, накопленные до init()
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

  connect(explicitToken?: string): void {
    if (!this.socket) {
      this.init(explicitToken)
      return
    }

    // ✅ Если сокет уже существует, но не подключён — обновляем токен и подключаемся
    if (!this.socket.connected) {
      const authToken = explicitToken || this.getJwtToken() || ''

      // 👇 Обновляем конфиг перед подключением
      if (this.socket.io) {
        (this.socket.io.opts as any).auth = authToken ? { token: authToken } : {}
      }

      console.log('[SocketService] 🔑 Подключение с токеном (длина:', authToken?.length || 0, ')')
      this.socket.connect()
    }
    // ✅ Если сокет уже подключён, но нужно обновить токен — переподключаемся
    else if (explicitToken && this.socket.connected) {
      const authToken = explicitToken
      console.log('[SocketService] 🔄 Токен обновлён, переподключение...')

      // Отключаемся
      this.socket.disconnect()

      // Обновляем конфиг
      if (this.socket.io) {
        (this.socket.io.opts as any).auth = { token: authToken }
      }

      // Подключаемся заново
      setTimeout(() => {
        this.socket?.connect()
      }, 100)
    }
  }

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
  on<T = any>(event: string, handler: SocketEventHandler<T>): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    const handlers = this.eventHandlers.get(event)!
    handlers.add(handler as SocketEventHandler)

    if (handlers.size === 1 && this.socket) {
      this.socket.on(event, (data: T) => {
        for (const h of handlers) {
          h(data)
        }
      })
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
    if (handlers.size === 0 && this.socket) {
      this.socket.off(event)
      this.eventHandlers.delete(event)
    }
  }

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
  getConnected(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  getSocketId(): string | undefined {
    return this.socket?.id
  }

  getTransport(): string {
    return this.socket?.io?.engine?.transport?.name || 'unknown'
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
      // 🔐 Очищаем куки только при невалидном токене, НЕ при его отсутствии
      const isInvalidToken =
        error.message?.includes('Unauthorized') ||
        error.message?.includes('Invalid token') ||
        error.message?.includes('User not found')

      if (isInvalidToken && process.client) {
        console.log('[SocketService] 🔐 Невалидный токен, очищаем состояние')
        useCookie('auth_token').value = null
        useCookie('session_id').value = null
        // Не вызываем logout() чтобы избежать циклических зависимостей и Buffer errors
        window.location.href = '/login'
      }
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

    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log('[SocketService] 🔄 Переподключено после', attemptNumber, 'попыток')
    })

    this.socket.on('reconnect_error', (error: any) => {
      console.error('[SocketService] ⚠️ Ошибка переподключения:', error.message)
    })

    this.socket.on('reconnect_failed', () => {
      console.error('[SocketService] ❌ Не удалось переподключиться после всех попыток')
    })

    this.socket.io.on('reconnect_attempt', (attempt: number) => {
      console.log(`[SocketService] 🔄 Попытка переподключения ${attempt}`)
    })
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

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
      setSessionId(data.sessionId)
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
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
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
  const emit = <T = any, R = any>(event: string, data?: T): Promise<R> => socketService.emit(event, data)
  const subscribeToBoard = (boardId: number) => socketService.subscribeToBoard(boardId)
  const unsubscribeFromBoard = (boardId: number) => socketService.unsubscribeFromBoard(boardId)
  const unsubscribeFromAll = () => socketService.unsubscribeFromAll()
  const isConnected = () => socketService.getConnected()
  const getSocketId = () => socketService.getSocketId()
  const getCurrentBoardId = () => socketService.getCurrentBoardId()
  const getSubscribedBoards = () => socketService.getSubscribedBoards()

  return {
    init, connect, disconnect, on, off, emit,
    subscribeToBoard, unsubscribeFromBoard, unsubscribeFromAll,
    isConnected, getSocketId, getCurrentBoardId, getSubscribedBoards
  }
}
