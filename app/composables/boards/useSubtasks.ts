// composables/boards/useSubtasks.ts
/**
 * Composable для работы с подзадачами
 * 
 * Архитектура:
 * - Обёртка над subtasksStore для удобного использования в компонентах
 * - Интеграция с SocketService для real-time обновлений
 * - Подписка на комнату доски (board:{boardId})
 * - Методы для CRUD операций с подзадачами
 * - Построение дерева подзадач из flat-списка
 */

import { useSubtasksStore } from 'stores/boards/subtasks'
import { socketService } from 'services/socket.service'
import type { Subtask, SubtaskTree, CreateSubtaskData, UpdateSubtaskData } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'
import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

/**
 * Интерфейс возвращаемых данных composable
 */
export interface UseSubtasksReturn {
  // State
  subtasks: ComputedRef<Subtask[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // Getters
  getSubtasksByTaskId: (taskId: number) => Subtask[]
  buildSubtaskTree: (taskId: number) => SubtaskTree[]
  getSubtaskStats: (taskId: number) => { total: number; completed: number; progress: number }
  canAddChildSubtask: (parentId: number | null) => boolean
  
  // Actions - HTTP
  fetchSubtasks: (taskId: number) => Promise<Subtask[]>
  createSubtask: (taskId: number, data: CreateSubtaskData) => Promise<Subtask>
  updateSubtask: (id: number, data: UpdateSubtaskData) => Promise<Subtask>
  completeSubtask: (id: number, isCompleted?: boolean, updateChildren?: boolean) => Promise<Subtask>
  deleteSubtask: (id: number) => Promise<void>
  
  // Actions - Socket Subscription
  subscribeToBoard: (boardId: number) => void
  unsubscribeFromBoard: (boardId: number) => void
  
  // Actions - Utility
  clearTaskSubtasks: (taskId: number) => void
  clearState: () => void
}

/**
 * Composable для работы с подзадачами
 * 
 * @example
 * ```ts
 * const {
 *   subtasks,
 *   loading,
 *   error,
 *   fetchSubtasks,
 *   createSubtask,
 *   subscribeToBoard
 * } = useSubtasks()
 * 
 * onMounted(async () => {
 *   await fetchSubtasks(taskId.value)
 *   subscribeToBoard(boardId.value)
 * })
 * 
 * onUnmounted(() => {
 *   unsubscribeFromBoard(boardId.value)
 * })
 * ```
 */
export function useSubtasks(): UseSubtasksReturn {
  // ============================================
  // STORES
  // ============================================
  
  const subtasksStore = useSubtasksStore()
  
  // ============================================
  // STATE (из store)
  // ============================================
  
  /**
   * Все подзадачи (flat-массив)
   */
  const subtasks = computed(() => subtasksStore.allSubtasks)
  
  /**
   * Статус загрузки
   */
  const loading = ref(subtasksStore.loading)
  
  /**
   * Ошибка операции
   */
  const error = ref<string | null>(null)
  
  // ============================================
  // GETTERS (обёртки над store getters)
  // ============================================
  
  /**
   * Получить подзадачи задачи (flat список)
   * @param taskId - ID задачи
   * @returns Массив подзадач
   */
  function getSubtasksByTaskId(taskId: number): Subtask[] {
    return subtasksStore.getSubtasksByTaskId(taskId)
  }
  
  /**
   * Построить дерево подзадач для задачи
   * @param taskId - ID задачи
   * @returns Древовидная структура подзадач
   */
  function buildSubtaskTree(taskId: number): SubtaskTree[] {
    return subtasksStore.buildSubtaskTree(taskId)
  }
  
  /**
   * Получить статистику подзадач задачи
   * @param taskId - ID задачи
   * @returns Объект со статистикой (total, completed, progress)
   */
  function getSubtaskStats(taskId: number): { total: number; completed: number; progress: number } {
    return subtasksStore.getSubtaskStats(taskId)
  }
  
  /**
   * Проверить, можно ли добавить дочернюю подзадачу
   * @param parentId - ID родительской подзадачи (null для корневых)
   * @returns true если можно добавить
   */
  function canAddChildSubtask(parentId: number | null): boolean {
    return subtasksStore.canAddChildSubtask(parentId)
  }
  
  // ============================================
  // ACTIONS - HTTP Operations
  // ============================================
  
  /**
   * Загрузить подзадачи задачи
   * ⚠️ HTTP запрос используется только для начальной загрузки
   * ⚠️ Дальнейшие обновления приходят через Socket
   * 
   * @param taskId - ID задачи
   * @returns Массив подзадач
   */
  async function fetchSubtasks(taskId: number): Promise<Subtask[]> {
    try {
      console.log(`[useSubtasks] 📥 Fetching subtasks for task ${taskId}`)
      
      const result = await subtasksStore.fetchSubtasks(taskId)
      
      // Синхронизируем local state со store
      loading.value = subtasksStore.loading
      error.value = subtasksStore.error
      
      return result
    } catch (err: any) {
      console.error(`[useSubtasks] ❌ Failed to fetch subtasks:`, err)
      error.value = err.message || 'Ошибка загрузки подзадач'
      throw err
    }
  }
  
  /**
   * Создать подзадачу
   * ⚠️ После успешного создания придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   * 
   * @param taskId - ID задачи
   * @param data - Данные для создания
   * @returns Созданная подзадача
   */
  async function createSubtask(
    taskId: number,
    data: CreateSubtaskData
  ): Promise<Subtask> {
    try {
      console.log(`[useSubtasks] 📤 Creating subtask for task ${taskId}`, data)
      
      // Проверка максимальной глубины
      if (data.parentId !== null && data.parentId !== undefined) {
        const depth = subtasksStore.getMaxDepthForSubtask(data.parentId)
        if (depth >= MAX_SUBTASK_DEPTH) {
          throw new Error(
            `Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней) достигнута`
          )
        }
      }
      
      const result = await subtasksStore.createSubtask(taskId, data)
      
      // Синхронизируем local state со store
      loading.value = subtasksStore.loading
      error.value = subtasksStore.error
      
      console.log(`[useSubtasks] ✅ Subtask created: ${result.id}`)
      
      return result
    } catch (err: any) {
      console.error(`[useSubtasks] ❌ Failed to create subtask:`, err)
      error.value = err.message || 'Ошибка создания подзадачи'
      throw err
    }
  }
  
  /**
   * Обновить подзадачу
   * ⚠️ После успешного обновления придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   * 
   * @param id - ID подзадачи
   * @param data - Данные для обновления
   * @returns Обновлённая подзадача
   */
  async function updateSubtask(
    id: number,
    data: UpdateSubtaskData
  ): Promise<Subtask> {
    try {
      console.log(`[useSubtasks] 📤 Updating subtask ${id}`, data)
      
      // Проверка циклической зависимости при смене родителя
      if (data.parentId !== undefined && data.parentId !== null) {
        const hasCircular = await subtasksStore.hasCircularDependency(id, data.parentId)
        if (hasCircular) {
          throw new Error(
            'Обнаружена циклическая зависимость: нельзя сделать подзадачу дочерней самой себя или своего потомка'
          )
        }
        
        // Проверка максимальной глубины
        const depth = subtasksStore.getMaxDepthForSubtask(data.parentId)
        if (depth >= MAX_SUBTASK_DEPTH) {
          throw new Error(
            `Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней) достигнута`
          )
        }
      }
      
      const result = await subtasksStore.updateSubtask(id, data)
      
      // Синхронизируем local state со store
      loading.value = subtasksStore.loading
      error.value = subtasksStore.error
      
      console.log(`[useSubtasks] ✅ Subtask updated: ${result.id}`)
      
      return result
    } catch (err: any) {
      console.error(`[useSubtasks] ❌ Failed to update subtask:`, err)
      error.value = err.message || 'Ошибка обновления подзадачи'
      throw err
    }
  }
  
  /**
   * Завершить/развернуть подзадачу
   * ⚠️ После успешного изменения придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   * 
   * @param id - ID подзадачи
   * @param isCompleted - Новый статус (если не указан, переключается)
   * @param updateChildren - Обновить ли статус дочерних подзадач
   * @returns Обновлённая подзадача
   */
  async function completeSubtask(
    id: number,
    isCompleted?: boolean,
    updateChildren: boolean = false
  ): Promise<Subtask> {
    try {
      console.log(`[useSubtasks] 📤 Completing subtask ${id}`, { isCompleted, updateChildren })
      
      const result = await subtasksStore.completeSubtask(id, isCompleted, updateChildren)
      
      // Синхронизируем local state со store
      loading.value = subtasksStore.loading
      error.value = subtasksStore.error
      
      console.log(`[useSubtasks] ✅ Subtask completed: ${result.id}`)
      
      return result
    } catch (err: any) {
      console.error(`[useSubtasks] ❌ Failed to complete subtask:`, err)
      error.value = err.message || 'Ошибка изменения статуса подзадачи'
      throw err
    }
  }
  
  /**
   * Удалить подзадачу
   * ⚠️ После успешного удаления придёт Socket событие
   * ⚠️ Store обновится автоматически через SocketService
   * ⚠️ Удаляются все дочерние подзадачи (каскадно)
   * 
   * @param id - ID подзадачи
   */
  async function deleteSubtask(id: number): Promise<void> {
    try {
      console.log(`[useSubtasks] 📤 Deleting subtask ${id}`)
      
      await subtasksStore.deleteSubtask(id)
      
      // Синхронизируем local state со store
      loading.value = subtasksStore.loading
      error.value = subtasksStore.error
      
      console.log(`[useSubtasks] ✅ Subtask deleted: ${id}`)
    } catch (err: any) {
      console.error(`[useSubtasks] ❌ Failed to delete subtask:`, err)
      error.value = err.message || 'Ошибка удаления подзадачи'
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
    console.log(`[useSubtasks] 🔔 Subscribing to board ${boardId}`)
    
    // Подписка через SocketService
    socketService.subscribeToBoard(boardId)
    
    // Обновляем store
    subtasksStore.subscribeToBoard(boardId)
    
    console.log(`[useSubtasks] ✅ Subscribed to board ${boardId}`)
  }
  
  /**
   * Отписаться от обновлений доски
   * 
   * @param boardId - ID доски
   */
  function unsubscribeFromBoard(boardId: number): void {
    console.log(`[useSubtasks] 📴 Unsubscribing from board ${boardId}`)
    
    // Отписка через SocketService
    socketService.unsubscribeFromBoard(boardId)
    
    // Обновляем store
    subtasksStore.unsubscribeFromBoard()
    
    console.log(`[useSubtasks] ✅ Unsubscribed from board ${boardId}`)
  }
  
  // ============================================
  // ACTIONS - Utility
  // ============================================
  
  /**
   * Очистить подзадачи конкретной задачи
   * @param taskId - ID задачи
   */
  function clearTaskSubtasks(taskId: number): void {
    console.log(`[useSubtasks] 🧹 Clearing subtasks for task ${taskId}`)
    subtasksStore.clearTaskSubtasks(taskId)
  }
  
  /**
   * Очистить всё состояние store
   * ⚠️ Используется при размонтировании компонента или смене доски
   */
  function clearState(): void {
    console.log(`[useSubtasks] 🧹 Clearing all subtasks state`)
    subtasksStore.clearState()
    
    // Синхронизируем local state
    loading.value = false
    error.value = null
  }
  
  // ============================================
  // WATCHERS - Синхронизация state со store
  // ============================================
  
  // Отслеживаем изменения loading в store
  watch(
    () => subtasksStore.loading,
    (newLoading) => {
      loading.value = newLoading
    }
  )
  
  // Отслеживаем изменения error в store
  watch(
    () => subtasksStore.error,
    (newError) => {
      error.value = newError
    }
  )
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    subtasks,
    loading,
    error,
    
    // Getters
    getSubtasksByTaskId,
    buildSubtaskTree,
    getSubtaskStats,
    canAddChildSubtask,
    
    // Actions - HTTP
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    completeSubtask,
    deleteSubtask,
    
    // Actions - Socket Subscription
    subscribeToBoard,
    unsubscribeFromBoard,
    
    // Actions - Utility
    clearTaskSubtasks,
    clearState
  }
}
