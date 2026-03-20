// composables/boards/useColumns.ts

/**
 * Composable для работы с кастомными колонками досок
 *
 * Архитектура:
 * - Обёртка над columnsStore для удобного использования в компонентах
 * - Интеграция с SocketService для real-time обновлений
 * - Подписка на комнату доски (board:{boardId})
 * - Методы для CRUD операций с колонками
 * - Оптимистичные обновления UI для Drag & Drop
 * - Логирование на русском языке
 */
import { useColumnsStore } from 'stores/boards/columns'
import { socketService } from 'services/socket.service'
import type { BoardColumn, CreateBoardColumnData, UpdateBoardColumnData } from '~/types/boards'
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

// ============================================
// ТИПЫ
// ============================================
/**
 * Интерфейс возвращаемых данных composable
 */
export interface UseColumnsReturn {
  // State
  columns: ComputedRef<BoardColumn[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // Getters
  getColumnsByBoardId: (boardId: number) => BoardColumn[]
  getColumnById: (columnId: number) => BoardColumn | null
  getSortedColumnsByBoard: (boardId: number) => BoardColumn[]
  
  // Actions - HTTP
  fetchColumns: (boardId: number) => Promise<BoardColumn[]>
  createColumn: (boardId: number, data: CreateBoardColumnData) => Promise<BoardColumn>
  updateColumn: (columnId: number, data: UpdateBoardColumnData) => Promise<BoardColumn>
  deleteColumn: (columnId: number) => Promise<void>
  updateColumnsOrder: (boardId: number, updates: Array<{ id: number; order: number }>) => Promise<void>
  
  // Actions - Socket Subscription
  subscribeToBoard: (boardId: number) => void
  unsubscribeFromBoard: (boardId: number) => void
  
  // Actions - Optimistic Updates
  updateColumnOptimistic: (columnId: number, data: Partial<BoardColumn>) => void
  updateColumnsOrderOptimistic: (boardId: number, orderedColumns: BoardColumn[]) => void
  
  // Actions - Utility
  clearBoardColumns: (boardId: number) => void
  clearState: () => void
}

// ============================================
// COMPOSABLE
// ============================================
/**
 * Composable для работы с колонками досок
 *
 * @example
 * ```ts
 * const {
 *   columns,
 *   loading,
 *   error,
 *   fetchColumns,
 *   createColumn,
 *   subscribeToBoard
 * } = useColumns()
 *
 * onMounted(async () => {
 *   await fetchColumns(boardId.value)
 *   subscribeToBoard(boardId.value)
 * })
 *
 * onUnmounted(() => {
 *   unsubscribeFromBoard(boardId.value)
 * })
 * ```
 */
export function useColumns(): UseColumnsReturn {
  // ============================================
  // STORES
  // ============================================
  const columnsStore = useColumnsStore()
  
  // ============================================
  // STATE (из store)
  // ============================================
  /**
   * Все колонки (flat-массив)
   */
  const columns = computed(() => columnsStore.allColumns)
  
  /**
   * Статус загрузки
   */
  const loading = ref(columnsStore.loading)
  
  /**
   * Ошибка операции
   */
  const error = ref<string | null>(null)
  
  // ============================================
  // GETTERS (обёртки над store getters)
  // ============================================
  /**
   * Получить колонки конкретной доски
   * @param boardId - ID доски
   * @returns Массив колонок
   */
  function getColumnsByBoardId(boardId: number): BoardColumn[] {
    return columnsStore.getColumnsByBoardId(boardId)
  }
  
  /**
   * Получить колонку по ID
   * @param columnId - ID колонки
   * @returns Колонка или null
   */
  function getColumnById(columnId: number): BoardColumn | null {
    return columnsStore.getColumnById(columnId)
  }
  
  /**
   * Получить отсортированные колонки доски (по order)
   * @param boardId - ID доски
   * @returns Отсортированный массив колонок
   */
  function getSortedColumnsByBoard(boardId: number): BoardColumn[] {
    return columnsStore.getSortedColumnsByBoard(boardId)
  }
  
  // ============================================
  // ACTIONS - HTTP Operations
  // ============================================
  /**
   * Загрузить все колонки доски
   * ⚠️ HTTP запрос используется только для начальной загрузки
   * ⚠️ Дальнейшие обновления приходят через Socket
   *
   * @param boardId - ID доски
   * @returns Массив колонок
   */
  async function fetchColumns(boardId: number): Promise<BoardColumn[]> {
    try {
      console.log(`[useColumns] 📥 Загрузка колонок для доски ${boardId}`)
      const result = await columnsStore.fetchColumns(boardId)
      // Синхронизируем local state со store
      loading.value = columnsStore.loading
      error.value = columnsStore.error
      console.log(`[useColumns] ✅ Загружено ${result.length} колонок`)
      return result
    } catch (err: any) {
      console.error(`[useColumns] ❌ Ошибка загрузки колонок:`, err)
      error.value = err.message || 'Ошибка загрузки колонок'
      throw err
    }
  }
  
  /**
   * Создать новую колонку
   * ⚠️ После успешного создания придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   *
   * @param boardId - ID доски
   * @param data - Данные для создания
   * @returns Созданная колонка
   */
  async function createColumn(
    boardId: number,
    data: CreateBoardColumnData
  ): Promise<BoardColumn> {
    try {
      console.log(`[useColumns] 📤 Создание колонки на доске ${boardId}`, data)
      const result = await columnsStore.createColumn(boardId, data)
      // Синхронизируем local state со store
      loading.value = columnsStore.loading
      error.value = columnsStore.error
      console.log(`[useColumns] ✅ Колонка создана: ${result.id}`)
      return result
    } catch (err: any) {
      console.error(`[useColumns] ❌ Ошибка создания колонки:`, err)
      error.value = err.message || 'Ошибка создания колонки'
      throw err
    }
  }
  
  /**
   * Обновить колонку
   * ⚠️ После успешного обновления придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   *
   * @param columnId - ID колонки
   * @param data - Данные для обновления
   * @returns Обновлённая колонка
   */
  async function updateColumn(
    columnId: number,
    data: UpdateBoardColumnData
  ): Promise<BoardColumn> {
    try {
      console.log(`[useColumns] 📤 Обновление колонки ${columnId}`, data)
      const result = await columnsStore.updateColumn(columnId, data)
      // Синхронизируем local state со store
      loading.value = columnsStore.loading
      error.value = columnsStore.error
      console.log(`[useColumns] ✅ Колонка обновлена: ${result.id}`)
      return result
    } catch (err: any) {
      console.error(`[useColumns] ❌ Ошибка обновления колонки:`, err)
      error.value = err.message || 'Ошибка обновления колонки'
      throw err
    }
  }
  
  /**
   * Удалить колонку
   * ⚠️ После успешного удаления придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   *
   * @param columnId - ID колонки
   */
  async function deleteColumn(columnId: number): Promise<void> {
    try {
      console.log(`[useColumns] 📤 Удаление колонки ${columnId}`)
      await columnsStore.deleteColumn(columnId)
      // Синхронизируем local state со store
      loading.value = columnsStore.loading
      error.value = columnsStore.error
      console.log(`[useColumns] ✅ Колонка удалена: ${columnId}`)
    } catch (err: any) {
      console.error(`[useColumns] ❌ Ошибка удаления колонки:`, err)
      error.value = err.message || 'Ошибка удаления колонки'
      throw err
    }
  }
  
  /**
   * Изменить порядок колонок (для Drag & Drop)
   * ⚠️ После успешного изменения придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   *
   * @param boardId - ID доски
   * @param updates - Массив обновлений порядка
   */
  async function updateColumnsOrder(
    boardId: number,
    updates: Array<{ id: number; order: number }>
  ): Promise<void> {
    try {
      console.log(`[useColumns] 📤 Изменение порядка колонок на доске ${boardId}`)
      await columnsStore.updateColumnsOrder(boardId, updates)
      // Синхронизируем local state со store
      loading.value = columnsStore.loading
      error.value = columnsStore.error
      console.log(`[useColumns] ✅ Порядок колонок изменён`)
    } catch (err: any) {
      console.error(`[useColumns] ❌ Ошибка изменения порядка колонок:`, err)
      error.value = err.message || 'Ошибка изменения порядка колонок'
      throw err
    }
  }
  
  // ============================================
  // ACTIONS - Socket Subscription
  // ============================================
  /**
   * Подписаться на обновления доски
   * ⚠️ Все пользователи в комнате видят изменения мгновенно
   *
   * @param boardId - ID доски
   */
  function subscribeToBoard(boardId: number): void {
    console.log(`[useColumns] 🔔 Подписка на обновления доски ${boardId}`)
    // Подписка через SocketService
    socketService.subscribeToBoard(boardId)
    // Обновляем store
    columnsStore.subscribeToBoard(boardId)
    console.log(`[useColumns] ✅ Подписка на доску ${boardId} активна`)
  }
  
  /**
   * Отписаться от обновлений доски
   *
   * @param boardId - ID доски
   */
  function unsubscribeFromBoard(boardId: number): void {
    console.log(`[useColumns] 📴 Отписка от обновлений доски ${boardId}`)
    // Отписка через SocketService
    socketService.unsubscribeFromBoard(boardId)
    // Обновляем store
    columnsStore.unsubscribeFromBoard(boardId)
    console.log(`[useColumns] ✅ Отписка от доски ${boardId} завершена`)
  }
  
  // ============================================
  // ACTIONS - Optimistic Updates (UI only)
  // ============================================
  /**
   * Обновить колонку оптимистично (до подтверждения сервера)
   * ⚠️ Используется только для UI-операций
   *
   * @param columnId - ID колонки
   * @param data - Данные для обновления
   */
  function updateColumnOptimistic(
    columnId: number,
    data: Partial<BoardColumn>
  ): void {
    console.log(`[useColumns] 🔄 Оптимистичное обновление колонки ${columnId}:`, data)
    columnsStore.updateColumnOptimistic(columnId, data)
  }
  
  /**
   * Обновить порядок колонок оптимистично (для drag&drop)
   * ✅ ТОЧЕЧНОЕ ОБНОВЛЕНИЕ (in-place) для предотвращения перерисовки
   *
   * @param boardId - ID доски
   * @param orderedColumns - Массив колонок с новым порядком
   */
  function updateColumnsOrderOptimistic(
    boardId: number,
    orderedColumns: BoardColumn[]
  ): void {
    console.log(`[useColumns] 🔄 Оптимистичное изменение порядка колонок на доске ${boardId}`)
    columnsStore.updateColumnsOrderOptimistic(boardId, orderedColumns)
  }
  
  // ============================================
  // ACTIONS - Utility
  // ============================================
  /**
   * Очистить колонки конкретной доски
   * @param boardId - ID доски
   */
  function clearBoardColumns(boardId: number): void {
    console.log(`[useColumns] 🧹 Очистка колонок для доски ${boardId}`)
    columnsStore.clearBoardColumns(boardId)
  }
  
  /**
   * Очистить всё состояние store
   * ⚠️ Используется при размонтировании компонента или смене доски
   */
  function clearState(): void {
    console.log(`[useColumns] 🧹 Очистка всего состояния колонок`)
    columnsStore.clearState()
    // Синхронизируем local state
    loading.value = false
    error.value = null
  }
  
  // ============================================
  // WATCHERS - Синхронизация state со store
  // ============================================
  // Отслеживаем изменения loading в store
  watch(
    () => columnsStore.loading,
    (newLoading) => {
      loading.value = newLoading
    }
  )
  
  // Отслеживаем изменения error в store
  watch(
    () => columnsStore.error,
    (newError) => {
      error.value = newError
    }
  )
  
  // ============================================
  // RETURN
  // ============================================
  return {
    // State
    columns,
    loading,
    error,
    // Getters
    getColumnsByBoardId,
    getColumnById,
    getSortedColumnsByBoard,
    // Actions - HTTP
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    updateColumnsOrder,
    // Actions - Socket Subscription
    subscribeToBoard,
    unsubscribeFromBoard,
    // Actions - Optimistic
    updateColumnOptimistic,
    updateColumnsOrderOptimistic,
    // Actions - Utility
    clearBoardColumns,
    clearState
  }
}
