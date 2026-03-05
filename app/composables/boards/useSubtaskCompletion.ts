// composables/boards/useSubtaskCompletion.ts
/**
 * Composable для управления завершением подзадач
 * 
 * Архитектура:
 * - Завершение/развернуть подзадачи с детьми
 * - Автоматическое завершение дочерних при завершении родителя
 * - Возможность отката (toggle back) при случайном нажатии
 * - Интеграция с subtasksStore и socket событиями
 * - Визуальная обратная связь о состоянии
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useSubtasks } from './useSubtasks'
import { useNotifications } from '~/composables/useNotifications'
import type { Subtask, SubtaskTree } from '~/types/boards'

/**
 * Интерфейс состояния подзадачи для отслеживания
 */
export interface SubtaskCompletionState {
  id: number
  isCompleted: boolean
  previousState: boolean | null
  hasChildren: boolean
  childrenCompleted: number
  childrenTotal: number
}

/**
 * Интерфейс возвращаемых данных composable
 */
export interface UseSubtaskCompletionReturn {
  // State
  completionStates: Ref<Record<number, SubtaskCompletionState>>
  isProcessing: Ref<Record<number, boolean>>
  
  // Getters
  getCompletionState: (subtaskId: number) => SubtaskCompletionState | null
  isSubtaskCompleted: (subtaskId: number) => boolean
  getChildrenProgress: (subtaskId: number) => { completed: number; total: number; percent: number }
  
  // Actions
  toggleComplete: (subtaskId: number, updateChildren?: boolean) => Promise<void>
  completeWithChildren: (subtaskId: number, isCompleted: boolean) => Promise<void>
  restorePreviousState: (subtaskId: number) => Promise<void>
  
  // Utility
  calculateChildrenProgress: (subtaskId: number, allSubtasks: Subtask[]) => { completed: number; total: number }
  resetState: () => void
}

/**
 * Конфигурация composable
 */
interface CompletionConfig {
  /**
   * Автоматически завершать дочерние при завершении родителя
   */
  autoCompleteChildren: boolean
  
  /**
   * Показывать уведомления об изменениях
   */
  showNotifications: boolean
  
  /**
   * Задержка перед возможностью отката (мс)
   */
  rollbackDelay: number
  
  /**
   * Сохранять историю состояний для отката
   */
  enableRollback: boolean
}

/**
 * Composable для управления завершением подзадач
 * 
 * @example
 * ```ts
 * const {
 *   toggleComplete,
 *   completeWithChildren,
 *   getChildrenProgress,
 *   isSubtaskCompleted
 * } = useSubtaskCompletion(taskId.value)
 * 
 * // В компоненте
 * <input
 *   type="checkbox"
 *   :checked="isSubtaskCompleted(subtask.id)"
 *   @change="toggleComplete(subtask.id, true)"
 * />
 * ```
 */
export function useSubtaskCompletion(
  taskId: number,
  config: Partial<CompletionConfig> = {}
): UseSubtaskCompletionReturn {
  // ============================================
  // CONFIG
  // ============================================
  
  const defaultConfig: CompletionConfig = {
    autoCompleteChildren: true,
    showNotifications: true,
    rollbackDelay: 3000,
    enableRollback: true
  }
  
  const mergedConfig = { ...defaultConfig, ...config }
  
  // ============================================
  // COMPOSABLES
  // ============================================
  
  const {
    completeSubtask,
    getSubtasksByTaskId,
    buildSubtaskTree
  } = useSubtasks()
  
  const notifications = useNotifications()
  
  // ============================================
  // STATE
  // ============================================
  
  /**
   * Состояния завершения подзадач
   * Ключ: subtaskId, Значение: состояние
   */
  const completionStates = ref<Record<number, SubtaskCompletionState>>({})
  
  /**
   * Флаги обработки операций
   * Ключ: subtaskId, Значение: идет ли обработка
   */
  const isProcessing = ref<Record<number, boolean>>({})
  
  /**
   * Таймеры для отката состояний
   * Ключ: subtaskId, Значение: timer ID
   */
  const rollbackTimers = ref<Record<number, NodeJS.Timeout>>({})
  
  // ============================================
  // COMPUTED
  // ============================================
  
  /**
   * Получить состояние завершения подзадачи
   */
  function getCompletionState(subtaskId: number): SubtaskCompletionState | null {
    return completionStates.value[subtaskId] || null
  }
  
  /**
   * Проверить, завершена ли подзадача
   */
  function isSubtaskCompleted(subtaskId: number): boolean {
    const state = completionStates.value[subtaskId]
    return state?.isCompleted ?? false
  }
  
  /**
   * Получить прогресс дочерних подзадач
   */
  function getChildrenProgress(subtaskId: number): { 
    completed: number
    total: number
    percent: number
  } {
    const state = completionStates.value[subtaskId]
    if (!state || !state.hasChildren) {
      return { completed: 0, total: 0, percent: 0 }
    }
    
    const percent = state.childrenTotal > 0 
      ? Math.round((state.childrenCompleted / state.childrenTotal) * 100) 
      : 0
    
    return {
      completed: state.childrenCompleted,
      total: state.childrenTotal,
      percent
    }
  }
  
  // ============================================
  // METHODS - Utility
  // ============================================
  
  /**
   * Рассчитать прогресс дочерних подзадач
   * @param subtaskId - ID родительской подзадачи
   * @param allSubtasks - Flat-массив всех подзадач
   * @returns Объект с прогрессом
   */
  function calculateChildrenProgress(
    subtaskId: number,
    allSubtasks: Subtask[]
  ): { completed: number; total: number } {
    const children = getAllChildSubtasks(subtaskId, allSubtasks)
    const completed = children.filter(s => s.isCompleted).length
    
    return {
      completed,
      total: children.length
    }
  }
  
  /**
   * Получить все дочерние подзадачи (рекурсивно)
   */
  function getAllChildSubtasks(
    subtaskId: number,
    allSubtasks: Subtask[]
  ): Subtask[] {
    const result: Subtask[] = []
    
    const collectChildren = (parentId: number) => {
      const children = allSubtasks.filter(s => s.parentId === parentId)
      for (const child of children) {
        result.push(child)
        collectChildren(child.id)
      }
    }
    
    collectChildren(subtaskId)
    return result
  }
  
  /**
   * Инициализировать состояние подзадачи
   */
  function initializeSubtaskState(
    subtask: Subtask | SubtaskTree,
    allSubtasks: Subtask[]
  ): void {
    const children = getAllChildSubtasks(subtask.id, allSubtasks)
    const childrenCompleted = children.filter(s => s.isCompleted).length
    
    completionStates.value[subtask.id] = {
      id: subtask.id,
      isCompleted: subtask.isCompleted,
      previousState: null,
      hasChildren: children.length > 0,
      childrenCompleted,
      childrenTotal: children.length
    }
  }
  
  /**
   * Обновить состояние подзадачи из store
   */
  function updateStateFromStore(
    subtaskId: number,
    allSubtasks: Subtask[]
  ): void {
    const subtask = allSubtasks.find(s => s.id === subtaskId)
    if (!subtask) return
    
    const existingState = completionStates.value[subtaskId]
    const children = getAllChildSubtasks(subtaskId, allSubtasks)
    const childrenCompleted = children.filter(s => s.isCompleted).length
    
    completionStates.value[subtaskId] = {
      id: subtask.id,
      isCompleted: subtask.isCompleted,
      previousState: existingState?.previousState ?? null,
      hasChildren: children.length > 0,
      childrenCompleted,
      childrenTotal: children.length
    }
  }
  
  // ============================================
  // METHODS - Completion Actions
  // ============================================
  
  /**
   * Переключить статус завершения подзадачи
   * @param subtaskId - ID подзадачи
   * @param updateChildren - Обновить ли статус дочерних
   */
  async function toggleComplete(
    subtaskId: number,
    updateChildren: boolean = false
  ): Promise<void> {
    if (isProcessing.value[subtaskId]) {
      console.log(`[useSubtaskCompletion] ⏳ Already processing subtask ${subtaskId}`)
      return
    }
    
    const currentState = completionStates.value[subtaskId]
    if (!currentState) {
      console.warn(`[useSubtaskCompletion] ⚠️ No state found for subtask ${subtaskId}`)
      return
    }
    
    isProcessing.value[subtaskId] = true
    
    try {
      const newStatus = !currentState.isCompleted
      
      console.log(
        `[useSubtaskCompletion] 🔄 Toggling subtask ${subtaskId}:`,
        { from: currentState.isCompleted, to: newStatus, updateChildren }
      )
      
      // Сохраняем предыдущее состояние для возможного отката
      if (mergedConfig.enableRollback) {
        currentState.previousState = currentState.isCompleted
      }
      
      // Выполняем завершение
      await completeSubtask(subtaskId, newStatus, updateChildren && mergedConfig.autoCompleteChildren)
      
      // Обновляем локальное состояние
      currentState.isCompleted = newStatus
      
      // Показываем уведомление
      // if (mergedConfig.showNotifications) {
      //   notifications.success(
      //     newStatus ? 'Подзадача завершена' : 'Подзадача развернута'
      //   )
      // }
      
      // Если есть дети и включено авто-завершение, обновляем их состояния
      if (currentState.hasChildren && updateChildren && mergedConfig.autoCompleteChildren) {
        await updateChildrenStates(subtaskId, newStatus)
      }
      
      // Устанавливаем таймер для очистки предыдущего состояния
      if (mergedConfig.enableRollback && rollbackTimers.value[subtaskId]) {
        clearTimeout(rollbackTimers.value[subtaskId])
      }
      
      if (mergedConfig.enableRollback) {
        rollbackTimers.value[subtaskId] = setTimeout(() => {
          if (completionStates.value[subtaskId]) {
            completionStates.value[subtaskId].previousState = null
          }
          delete rollbackTimers.value[subtaskId]
        }, mergedConfig.rollbackDelay)
      }
      
    } catch (error: any) {
      console.error(`[useSubtaskCompletion] ❌ Failed to toggle subtask ${subtaskId}:`, error)
      
      // Откатываем состояние при ошибке
      if (currentState && currentState.previousState !== null) {
        currentState.isCompleted = currentState.previousState
      }
      
      if (mergedConfig.showNotifications) {
        notifications.error('Не удалось изменить статус подзадачи')
      }
      
      throw error
    } finally {
      isProcessing.value[subtaskId] = false
    }
  }
  
  /**
   * Завершить/развернуть подзадачу с детьми
   * @param subtaskId - ID подзадачи
   * @param isCompleted - Новый статус
   */
  async function completeWithChildren(
    subtaskId: number,
    isCompleted: boolean
  ): Promise<void> {
    const currentState = completionStates.value[subtaskId]
    if (!currentState) {
      console.warn(`[useSubtaskCompletion] ⚠️ No state found for subtask ${subtaskId}`)
      return
    }
    
    if (isProcessing.value[subtaskId]) {
      console.log(`[useSubtaskCompletion] ⏳ Already processing subtask ${subtaskId}`)
      return
    }
    
    // Если статус не изменился, ничего не делаем
    if (currentState.isCompleted === isCompleted) {
      console.log(`[useSubtaskCompletion] ⚠️ Status unchanged for subtask ${subtaskId}`)
      return
    }
    
    await toggleComplete(subtaskId, true)
  }
  
  /**
   * Восстановить предыдущее состояние (откат)
   * @param subtaskId - ID подзадачи
   */
  async function restorePreviousState(subtaskId: number): Promise<void> {
    const currentState = completionStates.value[subtaskId]
    if (!currentState || currentState.previousState === null) {
      console.warn(`[useSubtaskCompletion] ⚠️ No previous state to restore for subtask ${subtaskId}`)
      return
    }
    
    if (isProcessing.value[subtaskId]) {
      console.log(`[useSubtaskCompletion] ⏳ Already processing subtask ${subtaskId}`)
      return
    }
    
    isProcessing.value[subtaskId] = true
    
    try {
      console.log(
        `[useSubtaskCompletion] ⏮️ Restoring previous state for subtask ${subtaskId}:`,
        { from: currentState.isCompleted, to: currentState.previousState }
      )
      
      await completeSubtask(subtaskId, currentState.previousState, false)
      
      currentState.isCompleted = currentState.previousState
      currentState.previousState = null
      
      if (mergedConfig.showNotifications) {
        notifications.success('Статус восстановлен')
      }
      
    } catch (error: any) {
      console.error(`[useSubtaskCompletion] ❌ Failed to restore state for subtask ${subtaskId}:`, error)
      
      if (mergedConfig.showNotifications) {
        notifications.error('Не удалось восстановить статус')
      }
      
      throw error
    } finally {
      isProcessing.value[subtaskId] = false
    }
  }
  
  /**
   * Обновить состояния дочерних подзадач
   */
  async function updateChildrenStates(
    parentId: number,
    isCompleted: boolean
  ): Promise<void> {
    const allSubtasks = getSubtasksByTaskId(taskId)
    const children = getAllChildSubtasks(parentId, allSubtasks)
    
    console.log(
      `[useSubtaskCompletion] 🔄 Updating ${children.length} children states:`,
      { parentId, isCompleted }
    )
    
    // Обновляем локальные состояния
    for (const child of children) {
      if (completionStates.value[child.id]) {
        completionStates.value[child.id].isCompleted = isCompleted
        completionStates.value[child.id].previousState = !isCompleted
      }
    }
  }
  
  // ============================================
  // WATCHERS - Синхронизация с store
  // ============================================
  
  /**
   * Инициализировать состояния при изменении списка подзадач
   */
  watch(
    () => getSubtasksByTaskId(taskId),
    (newSubtasks) => {
      // ✅ ИСПРАВЛЕНО: Проверка на undefined/null
      if (!newSubtasks || newSubtasks.length === 0) {
        completionStates.value = {}
        return
      }
      
      // ✅ ИСПРАВЛЕНО: Явная типизация для TypeScript
      const subtasks = newSubtasks as Subtask[]
      
      // Инициализируем состояния для всех подзадач
      for (const subtask of subtasks) {
        if (!completionStates.value[subtask.id]) {
          initializeSubtaskState(subtask, subtasks)
        } else {
          updateStateFromStore(subtask.id, subtasks)
        }
      }
      
      // Удаляем состояния для удалённых подзадач
      // ✅ ИСПРАВЛЕНО: Безопасное создание Set
      const currentIds = new Set(subtasks.map(s => s?.id).filter((id): id is number => id !== undefined))
      
      for (const stateId of Object.keys(completionStates.value)) {
        const numericId = Number(stateId)
        if (!currentIds.has(numericId)) {
          delete completionStates.value[numericId]
          delete isProcessing.value[numericId]
          if (rollbackTimers.value[numericId]) {
            clearTimeout(rollbackTimers.value[numericId])
            delete rollbackTimers.value[numericId]
          }
        }
      }
    },
    { immediate: true, deep: true }
  )
  
  // ============================================
  // UTILITY
  // ============================================
  
  /**
   * Сбросить все состояния
   */
  function resetState(): void {
    console.log('[useSubtaskCompletion] 🧹 Resetting all completion states')
    
    // Очищаем таймеры
    for (const timerId of Object.values(rollbackTimers.value)) {
      clearTimeout(timerId)
    }
    
    completionStates.value = {}
    isProcessing.value = {}
    rollbackTimers.value = {}
  }
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    completionStates,
    isProcessing,
    
    // Getters
    getCompletionState,
    isSubtaskCompleted,
    getChildrenProgress,
    
    // Actions
    toggleComplete,
    completeWithChildren,
    restorePreviousState,
    
    // Utility
    calculateChildrenProgress,
    resetState
  }
}
