// stores/boards/columns.ts

/**
 * Store для управления кастомными колонками досок
 *
 * Архитектура:
 * - Хранение колонок в flat-массиве
 * - Группировка по доскам для быстрой фильтрации
 * - Обработка socket-событий для real-time обновлений
 * - Оптимистичные обновления UI для Drag & Drop
 * - Интеграция с tasksStore для привязки задач к колонкам
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BoardColumn, CreateBoardColumnData, UpdateBoardColumnData } from '~/types/boards'
import { socketService } from 'services/socket.service'
import { useApi } from '~/composables/useApi'

// ============================================
// ТИПЫ
// ============================================
export interface BoardColumnWithTasks extends BoardColumn {
  tasksCount?: number
}

// ============================================
// STORE
// ============================================
export const useColumnsStore = defineStore('columns', () => {
  // ============================================
  // STATE
  // ============================================
  /**
   * Flat-массив всех колонок
   */
  const columns = ref<BoardColumn[]>([])
  
  /**
   * Колонки по доскам (для быстрой фильтрации)
   */
  const columnsByBoard = ref<Record<number, BoardColumn[]>>({})
  
  /**
   * Статус загрузки
   */
  const loading = ref(false)
  
  /**
   * Ошибка операции
   */
  const error = ref<string | null>(null)
  
  /**
   * ID текущей доски (для контекста операций)
   */
  const currentBoardId = ref<number | null>(null)
  
  /**
   * ID текущей подписанной доски (для socket)
   */
  const subscribedBoardId = ref<number | null>(null)

  // ============================================
  // GETTERS
  // ============================================
  /**
   * Все колонки (flat)
   */
  const allColumns = computed(() => columns.value)
  
  /**
   * Колонки конкретной доски
   */
  const getColumnsByBoardId = computed(() => {
    return (boardId: number) => columnsByBoard.value[boardId] || []
  })
  
  /**
   * Получить колонку по ID
   */
  const getColumnById = computed(() => {
    return (columnId: number) => columns.value.find(c => c.id === columnId) || null
  })
  
  /**
   * Отсортированные колонки доски (по order)
   */
  const getSortedColumnsByBoard = computed(() => {
    return (boardId: number) => {
      return [...(columnsByBoard.value[boardId] || [])].sort((a, b) => a.order - b.order)
    }
  })
  
  /**
   * Статистика колонок доски
   */
  const getColumnsStats = computed(() => {
    return (boardId: number) => {
      const boardColumns = columnsByBoard.value[boardId] || []
      return {
        total: boardColumns.length,
        empty: boardColumns.filter(c => c.name.trim() === '').length
      }
    }
  })

  // ============================================
  // ACTIONS - State Management
  // ============================================
  /**
   * Установить текущую доску
   */
  function setCurrentBoardId(boardId: number | null) {
    currentBoardId.value = boardId
    console.log(`[ColumnsStore] 📋 Current board set to: ${boardId}`)
  }

  // ============================================
  // ACTIONS - HTTP Operations
  // ============================================
  /**
   * Получить все колонки доски
   * 📡 HTTP запрос (начальная загрузка)
   */
  async function fetchColumns(boardId: number): Promise<BoardColumn[]> {
    loading.value = true
    error.value = null
    columns.value = []
    columnsByBoard.value = {}
    
    try {
      console.log(`[ColumnsStore] 📥 Fetching columns for board ${boardId}`)
      
      const api = useApi()
      const response = await api.get<{
        success: boolean
        columns: BoardColumn[]
        total: number
        boardId: number
      }>(`/api/boards/${boardId}/columns`)
      
      columns.value = response.columns || []
      columnsByBoard.value = { [boardId]: columns.value }
      setCurrentBoardId(boardId)
      
      console.log(`[ColumnsStore] ✅ Fetched ${response.columns.length} columns for board ${boardId}`)
      return response.columns
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке колонок'
      console.error('[ColumnsStore] ❌ Failed to fetch columns:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Получить колонку по ID
   * 📡 HTTP запрос (для деталей колонки)
   */
  async function fetchColumnById(columnId: number): Promise<BoardColumn> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[ColumnsStore] 📥 Fetching column by ID: ${columnId}`)
      
      // ⚠️ Пока нет endpoint для получения одной колонки
      // Используем fetchColumns и фильтруем
      const column = columns.value.find(c => c.id === columnId)
      if (column) {
        return column
      }
      
      // Если не найдена в кэше — ошибка
      throw new Error('Колонка не найдена')
    } catch (err: any) {
      error.value = err.message || 'Ошибка при загрузке колонки'
      console.error('[ColumnsStore] ❌ Failed to fetch column:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Создать новую колонку
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function createColumn(
    boardId: number,
    data: CreateBoardColumnData
  ): Promise<BoardColumn> {
    loading.value = true
    error.value = null
    
    try {
      console.log('[ColumnsStore] 📤 Creating column on server...')
      
      const api = useApi()
      const response = await api.post<{
        success: boolean
        column: BoardColumn
      }>(`/api/boards/${boardId}/columns`, data)
      
      if (!response.column) {
        throw new Error('Failed to create column: no column returned')
      }
      
      console.log('[ColumnsStore] ✅ Column created on server:', response.column.id)
      
      // ⛔ Не добавляем в store здесь — придёт socket событие
      // Это предотвращает дублирование при быстром сокете
      return response.column
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при создании колонки'
      console.error('[ColumnsStore] ❌ Failed to create column:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Обновить колонку
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function updateColumn(
    columnId: number,
    data: UpdateBoardColumnData
  ): Promise<BoardColumn> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[ColumnsStore] 📤 Updating column ${columnId} on server...`)
      
      // Находим boardId для endpoint
      const column = columns.value.find(c => c.id === columnId)
      if (!column?.boardId) {
        throw new Error('Не удалось определить доску для колонки')
      }
      
      const api = useApi()
      const response = await api.put<{
        success: boolean
        column: BoardColumn
      }>(`/api/boards/${column.boardId}/columns/${columnId}`, data)
      
      if (!response.column) {
        throw new Error('Failed to update column: no column returned')
      }
      
      console.log(`[ColumnsStore] ✅ Column ${columnId} updated on server.`)
      
      // ⛔ Не обновляем в store здесь — придёт socket событие
      return response.column
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении колонки'
      console.error('[ColumnsStore] ❌ Failed to update column:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Удалить колонку
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function deleteColumn(columnId: number): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[ColumnsStore] 📤 Deleting column ${columnId} on server...`)
      
      // Находим boardId для endpoint
      const column = columns.value.find(c => c.id === columnId)
      if (!column?.boardId) {
        throw new Error('Не удалось определить доску для колонки')
      }
      
      const api = useApi()
      await api.delete<{
        success: boolean
        message: string
        columnId: number
        boardId: number
      }>(`/api/boards/${column.boardId}/columns/${columnId}`)
      
      console.log(`[ColumnsStore] ✅ Column ${columnId} deleted on server.`)
      
      // ⛔ Не удаляем из store здесь — придёт socket событие
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при удалении колонки'
      console.error('[ColumnsStore] ❌ Failed to delete column:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Изменить порядок колонок (для Drag & Drop)
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function updateColumnsOrder(
    boardId: number,
    updates: Array<{ id: number; order: number }>
  ): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[ColumnsStore] 📤 Updating columns order for board ${boardId}...`)
      
      const api = useApi()
      await api.put<{
        success: boolean
        message: string
        boardId: number
        updated: number
      }>(`/api/boards/${boardId}/columns/order`, { updates })
      
      console.log(`[ColumnsStore] ✅ Columns order updated on server.`)
      
      // ⛔ Не обновляем в store здесь — придёт socket событие
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении порядка колонок'
      console.error('[ColumnsStore] ❌ Failed to update columns order:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ACTIONS - Optimistic Updates (UI only)
  // ============================================
  /**
   * Обновить колонку оптимистично (до подтверждения сервера)
   * ⚠️ Используется только для UI-операций
   */
function updateColumnOptimistic(columnId: number, data: Partial<BoardColumn>) {
  console.log(`[ColumnsStore] 🔄 Optimistically updating column ${columnId}:`, data)
  
  // ✅ ИСПРАВЛЕНО: Обновляем только существующие поля
  const globalIndex = columns.value.findIndex(c => c.id === columnId)
  if (globalIndex !== -1 && columns.value[globalIndex]) {
    // ✅ Создаём новый объект с объединением данных
    columns.value[globalIndex] = {
      ...columns.value[globalIndex],
      ...data
    } as BoardColumn
  }
  
  // Обновляем в columnsByBoard
  const column = columns.value[globalIndex]
  if (column?.boardId) {
    const boardColumns = columnsByBoard.value[column.boardId]
    if (boardColumns) {
      const boardIndex = boardColumns.findIndex(c => c.id === columnId)
      if (boardIndex !== -1 && boardColumns[boardIndex]) {
        // ✅ Создаём новый объект с объединением данных
        boardColumns[boardIndex] = {
          ...boardColumns[boardIndex],
          ...data
        } as BoardColumn
      }
    }
  }
}
  
  /**
   * Обновить порядок колонок оптимистично (для drag&drop)
   * ✅ ТОЧЕЧНОЕ ОБНОВЛЕНИЕ (in-place) для предотвращения перерисовки
   */
  function updateColumnsOrderOptimistic(
    boardId: number,
    orderedColumns: BoardColumn[]
  ) {
    console.log(`[ColumnsStore] 🔄 Optimistically reordering columns on board ${boardId}`)
    
    const boardColumns = columnsByBoard.value[boardId]
    if (boardColumns && boardColumns.length > 0) {
      boardColumns.forEach(column => {
        const updatedColumn = orderedColumns.find(c => c.id === column.id)
        if (updatedColumn) {
          column.order = updatedColumn.order
        }
      })
    }
    
    // Обновляем в глобальном списке
    if (columns.value && columns.value.length > 0) {
      columns.value.forEach(column => {
        if (column.boardId === boardId) {
          const updatedColumn = orderedColumns.find(c => c.id === column.id)
          if (updatedColumn) {
            column.order = updatedColumn.order
          }
        }
      })
    }
  }

  // ============================================
  // ACTIONS - Socket Event Handlers
  // ============================================
  /**
   * Обработка события создания колонки (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleColumnCreated(column: BoardColumn) {
    console.log(`[ColumnsStore] 📡 Socket: column:created ${column.id}`)
    
    const exists = columns.value.some(c => c.id === column.id)
    if (!exists) {
      columns.value = [...columns.value, column]
      
      if (column.boardId) {
        if (!columnsByBoard.value[column.boardId]) {
          columnsByBoard.value[column.boardId] = []
        }
        const boardColumns = columnsByBoard.value[column.boardId] || []
        const boardExists = boardColumns.some(c => c.id === column.id)
        if (!boardExists) {
          columnsByBoard.value[column.boardId] = [...boardColumns, column]
        }
      }
      
      console.log(`[ColumnsStore] ✅ Added column ${column.id} to store`)
    } else {
      console.log(`[ColumnsStore] ⚠️ Column ${column.id} already exists`)
    }
  }
  
  /**
   * Обработка события обновления колонки (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleColumnUpdated(column: BoardColumn) {
    console.log(`[ColumnsStore] 📡 Socket: column:updated ${column.id}`)
    
    // Обновляем в глобальном списке
    const globalIndex = columns.value.findIndex(c => c.id === column.id)
    if (globalIndex !== -1) {
      columns.value = [
        ...columns.value.slice(0, globalIndex),
        column,
        ...columns.value.slice(globalIndex + 1)
      ]
    } else {
      columns.value = [...columns.value, column]
    }
    
    // Обновляем в списке по доске
    if (column.boardId) {
      const boardColumns = columnsByBoard.value[column.boardId] ?? []
      const boardIndex = boardColumns.findIndex(c => c.id === column.id)
      if (boardIndex !== -1) {
        // Обновляем существующую колонку
        columnsByBoard.value[column.boardId] = [
          ...boardColumns.slice(0, boardIndex),
          column,
          ...boardColumns.slice(boardIndex + 1)
        ]
      } else {
        // Добавляем новую колонку в список доски
        columnsByBoard.value[column.boardId] = [...boardColumns, column]
      }
    }
    
    console.log(`[ColumnsStore] ✅ Updated column ${column.id} in store`)
  }
  
  /**
   * Обработка события удаления колонки (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleColumnDeleted(columnId: number) {
    console.log(`[ColumnsStore] 📡 Socket: column:deleted ${columnId}`)
    
    // Находим колонку для получения boardId
    const column = columns.value.find(c => c.id === columnId)
    const boardId = column?.boardId
    
    // Удаляем из глобального списка
    columns.value = columns.value.filter(c => c.id !== columnId)
    
    // Удаляем из списка по доске
    if (boardId && columnsByBoard.value[boardId]) {
      columnsByBoard.value[boardId] = columnsByBoard.value[boardId].filter(
        c => c.id !== columnId
      )
    }
    
    console.log(`[ColumnsStore] ✅ Deleted column ${columnId} from store`)
  }
  
  /**
   * Обработка события изменения порядка колонок (от Socket)
   * 📡 Вызывается из SocketService при reorder колонок
   */
  function handleColumnsReordered(data: {
    boardId: number
    columns: Array<{ id: number; order: number }>
  }) {
    console.log(`[ColumnsStore] 📡 Socket: columns:reordered`, data.columns)
    
    const boardColumns = columnsByBoard.value[data.boardId]
    if (boardColumns && boardColumns.length > 0) {
      boardColumns.forEach(column => {
        const reorderInfo = data.columns.find(c => c.id === column.id)
        if (reorderInfo) {
          column.order = reorderInfo.order
        }
      })
    }
    
    // Обновляем в глобальном списке
    if (columns.value && columns.value.length > 0) {
      columns.value.forEach(column => {
        if (column.boardId === data.boardId) {
          const reorderInfo = data.columns.find(c => c.id === column.id)
          if (reorderInfo) {
            column.order = reorderInfo.order
          }
        }
      })
    }
    
    console.log(`[ColumnsStore] ✅ Columns order updated for board ${data.boardId}`)
  }

  // ============================================
  // ACTIONS - Subscription Management
  // ============================================
  /**
   * Подписаться на обновления доски
   */
  function subscribeToBoard(boardId: number) {
    if (subscribedBoardId.value === boardId) {
      console.log(`[ColumnsStore] ⚠️ Already subscribed to board ${boardId}`)
      return
    }
    
    console.log(`[ColumnsStore] 🔔 Subscribing to board ${boardId}`)
    subscribedBoardId.value = boardId
    
    // Подписка через SocketService
    socketService.subscribeToBoard(boardId)
  }
  
  /**
   * Отписаться от обновлений доски
   */
  function unsubscribeFromBoard(boardId: number) {
    if (subscribedBoardId.value === null) return
    
    console.log(`[ColumnsStore] 📴 Unsubscribing from board ${subscribedBoardId.value}`)
    
    // Отписка через SocketService
    socketService.unsubscribeFromBoard(boardId)
    subscribedBoardId.value = null
  }

  // ============================================
  // ACTIONS - Utility
  // ============================================
  /**
   * Очистить состояние store
   */
  function clearState() {
    console.log('[ColumnsStore] 🧹 Clearing state')
    columns.value = []
    columnsByBoard.value = {}
    error.value = null
    currentBoardId.value = null
    subscribedBoardId.value = null
  }
  
  /**
   * Очистить колонки конкретной доски
   */
  function clearBoardColumns(boardId: number) {
    console.log(`[ColumnsStore] 🧹 Clearing columns for board ${boardId}`)
    columns.value = columns.value.filter(c => c.boardId !== boardId)
    delete columnsByBoard.value[boardId]
  }

  // ============================================
  // RETURN
  // ============================================
  return {
    // State
    columns,
    columnsByBoard,
    loading,
    error,
    currentBoardId,
    subscribedBoardId,
    
    // Getters
    allColumns,
    getColumnsByBoardId,
    getColumnById,
    getSortedColumnsByBoard,
    getColumnsStats,
    
    // Actions - State Management
    setCurrentBoardId,
    
    // Actions - HTTP
    fetchColumns,
    fetchColumnById,
    createColumn,
    updateColumn,
    deleteColumn,
    updateColumnsOrder,
    
    // Actions - Optimistic
    updateColumnOptimistic,
    updateColumnsOrderOptimistic,
    
    // Actions - Socket
    handleColumnCreated,
    handleColumnUpdated,
    handleColumnDeleted,
    handleColumnsReordered,
    
    // Actions - Subscription
    subscribeToBoard,
    unsubscribeFromBoard,
    
    // Actions - Utility
    clearState,
    clearBoardColumns
  }
})
