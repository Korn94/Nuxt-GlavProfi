// composables/boards/useSubtaskDragDrop.ts
/**
 * Composable для управления Drag & Drop подзадач
 * 
 * Архитектура:
 * - Обработка всех drag & drop событий
 * - Определение позиции drop (above/below/child)
 * - Валидация перемещения (глубина, циклы)
 * - Интеграция с useSubtasks для обновления
 * - Визуальная обратная связь (drop zones)
 */

import { ref, reactive, computed, type Ref } from 'vue'
import { useSubtasks } from './useSubtasks'
import { useNotifications } from '~/composables/useNotifications'
import { 
  validateParentChange, 
  calculateSubtaskDepth,
  hasCircularDependency,
  MAX_SUBTASK_DEPTH 
} from 'server/utils/subtasks'
import type { Subtask, SubtaskTree } from '~/types/boards'

/**
 * Позиция drop относительно целевой подзадачи
 */
export type DropPosition = 'above' | 'below' | 'child' | null

/**
 * Данные перетаскиваемой подзадачи
 */
export interface DragData {
  type: 'subtask'
  subtaskId: number
  taskId: number
  parentId: number | null
  originalOrder: number
}

/**
 * Интерфейс возвращаемых данных composable
 */
export interface UseSubtaskDragDropReturn {
  // State
  isDragging: Ref<boolean>
  draggingSubtaskId: Ref<number | null>
  dropTargetSubtaskId: Ref<number | null>
  dropPosition: Ref<DropPosition>
  canDrop: Ref<boolean>
  dropValidationError: Ref<string | null>
  
  // Drag Handlers
  handleDragStart: (event: DragEvent, subtask: Subtask) => void
  handleDragEnd: (event: DragEvent) => void
  
  // Drop Zone Handlers
  handleDragOver: (event: DragEvent, targetSubtask: Subtask) => void
  handleDragEnter: (event: DragEvent, targetSubtask: Subtask) => void
  handleDragLeave: (event: DragEvent, targetSubtask: Subtask) => void
  handleDrop: (event: DragEvent, targetSubtask: Subtask) => Promise<void>
  
  // Child Drop Zone Handlers
  handleChildDragOver: (event: DragEvent, parentSubtask: Subtask) => void
  handleChildDrop: (event: DragEvent, parentSubtask: Subtask) => Promise<void>
  
  // Utility
  resetDragState: () => void
  getDragData: () => DragData | null
}

/**
 * Конфигурация drag & drop
 */
interface DragDropConfig {
  /**
   * Отступ для определения позиции drop (в пикселях)
   * Если курсор выше этого значения от центра - above, ниже - below, иначе - child
   */
  positionThreshold: number
  
  /**
   * Задержка перед показом drop zone (мс)
   */
  dropZoneDelay: number
  
  /**
   * Показывать ли визуальную обратную связь
   */
  showVisualFeedback: boolean
}

/**
 * Composable для Drag & Drop подзадач
 * 
 * @example
 * ```ts
 * const {
 *   isDragging,
 *   dropPosition,
 *   canDrop,
 *   handleDragStart,
 *   handleDragOver,
 *   handleDrop
 * } = useSubtaskDragDrop(taskId.value, allSubtasks)
 * ```
 */
export function useSubtaskDragDrop(
  taskId: number,
  allSubtasks: Ref<Subtask[]>,
  config: Partial<DragDropConfig> = {}
): UseSubtaskDragDropReturn {
  // ============================================
  // CONFIG
  // ============================================
  
  const defaultConfig: DragDropConfig = {
    positionThreshold: 20,
    dropZoneDelay: 100,
    showVisualFeedback: true
  }
  
  const mergedConfig = { ...defaultConfig, ...config }
  
  // ============================================
  // COMPOSABLES
  // ============================================
  
  const { updateSubtask } = useSubtasks()
  const notifications = useNotifications()
  
  // ============================================
  // STATE
  // ============================================
  
  /**
   * Флаг активного перетаскивания
   */
  const isDragging = ref(false)
  
  /**
   * ID перетаскиваемой подзадачи
   */
  const draggingSubtaskId = ref<number | null>(null)
  
  /**
   * ID целевой подзадачи для drop
   */
  const dropTargetSubtaskId = ref<number | null>(null)
  
  /**
   * Позиция drop относительно целевой подзадачи
   */
  const dropPosition = ref<DropPosition>(null)
  
  /**
   * Можно ли выполнить drop в текущую позицию
   */
  const canDrop = ref(false)
  
  /**
   * Ошибка валидации (если drop невозможен)
   */
  const dropValidationError = ref<string | null>(null)
  
  /**
   * Данные перетаскиваемой подзадачи
   */
  const dragData = ref<DragData | null>(null)
  
  /**
   * Таймер для задержки drop zone
   */
  let dropZoneTimer: NodeJS.Timeout | null = null
  
  // ============================================
  // COMPUTED
  // ============================================
  
  /**
   * Получить перетаскиваемую подзадачу
   */
  const draggingSubtask = computed(() => {
    if (!draggingSubtaskId.value) return null
    return allSubtasks.value.find(s => s.id === draggingSubtaskId.value) || null
  })
  
  /**
   * Получить целевую подзадачу
   */
  const targetSubtask = computed(() => {
    if (!dropTargetSubtaskId.value) return null
    return allSubtasks.value.find(s => s.id === dropTargetSubtaskId.value) || null
  })
  
  // ============================================
  // VALIDATION
  // ============================================
  
  /**
   * Проверить возможность перемещения подзадачи
   * @param sourceId - ID перетаскиваемой подзадачи
   * @param targetId - ID целевой подзадачи
   * @param position - Позиция drop
   * @returns Результат валидации
   */
  function validateMove(
    sourceId: number,
    targetId: number,
    position: DropPosition
  ): { valid: boolean; error?: string } {
    // Нельзя перетаскивать на себя
    if (sourceId === targetId) {
      return { valid: false, error: 'Нельзя переместить подзадачу на саму себя' }
    }
    
    const sourceSubtask = allSubtasks.value.find(s => s.id === sourceId)
    const targetSubtask = allSubtasks.value.find(s => s.id === targetId)
    
    if (!sourceSubtask || !targetSubtask) {
      return { valid: false, error: 'Подзадача не найдена' }
    }
    
    // Для позиции 'child' проверяем глубину и циклы
    if (position === 'child') {
      // Проверка максимальной глубины
      const targetDepth = calculateSubtaskDepth(targetId, allSubtasks.value)
      if (targetDepth >= MAX_SUBTASK_DEPTH) {
        return { 
          valid: false, 
          error: `Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH + 1} уровней) достигнута` 
        }
      }
      
      // Проверка циклической зависимости
      if (hasCircularDependency(sourceId, targetId, allSubtasks.value)) {
        return { 
          valid: false, 
          error: 'Обнаружена циклическая зависимость: нельзя сделать подзадачу дочерней своего потомка' 
        }
      }
    }
    
    // Для позиций 'above'/'below' проверяем только если меняем родителя
    if ((position === 'above' || position === 'below') && sourceSubtask.parentId !== targetSubtask.parentId) {
      const validation = validateParentChange(sourceId, targetSubtask.parentId, allSubtasks.value)
      if (!validation.valid) {
        return { valid: false, error: validation.error }
      }
    }
    
    return { valid: true }
  }
  
  /**
   * Определить позицию drop на основе позиции курсора
   * @param event - Drag event
   * @param targetElement - Целевой DOM элемент
   * @returns Позиция drop
   */
  function determineDropPosition(
    event: DragEvent,
    targetElement: HTMLElement
  ): DropPosition {
    const rect = targetElement.getBoundingClientRect()
    const mouseY = event.clientY
    const elementCenterY = rect.top + rect.height / 2
    
    // Зона для child - центр элемента
    const childZoneStart = elementCenterY - mergedConfig.positionThreshold
    const childZoneEnd = elementCenterY + mergedConfig.positionThreshold
    
    if (mouseY < childZoneStart) {
      return 'above'
    } else if (mouseY > childZoneEnd) {
      return 'below'
    } else {
      return 'child'
    }
  }
  
  // ============================================
  // DRAG HANDLERS
  // ============================================
  
  /**
   * Обработчик начала перетаскивания
   */
  function handleDragStart(event: DragEvent, subtask: Subtask): void {
    if (!event.dataTransfer) {
      console.warn('[useSubtaskDragDrop] ❌ dataTransfer not available')
      return
    }
    
    console.log(`[useSubtaskDragDrop] 🎯 Drag start: subtask ${subtask.id}`)
    
    // Сохраняем данные
    draggingSubtaskId.value = subtask.id
    isDragging.value = true
    dragData.value = {
      type: 'subtask',
      subtaskId: subtask.id,
      taskId: subtask.taskId,
      parentId: subtask.parentId ?? null,
      originalOrder: subtask.order
    }
    
    // Настраиваем dataTransfer
    event.dataTransfer.setData('application/json', JSON.stringify(dragData.value))
    event.dataTransfer.effectAllowed = 'move'
    
    // Визуальная обратная связь
    if (mergedConfig.showVisualFeedback && event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.7'
      event.target.style.transform = 'scale(1.02)'
      event.target.style.cursor = 'grabbing'
    }
  }
  
  /**
   * Обработчик окончания перетаскивания
   */
  function handleDragEnd(event: DragEvent): void {
    console.log(`[useSubtaskDragDrop] 🏁 Drag end: subtask ${draggingSubtaskId.value}`)
    
    // Восстанавливаем стили
    if (mergedConfig.showVisualFeedback && event.target instanceof HTMLElement) {
      event.target.style.opacity = '1'
      event.target.style.transform = 'scale(1)'
      event.target.style.cursor = 'grab'
    }
    
    // Сбрасываем состояние
    resetDragState()
  }
  
  // ============================================
  // DROP ZONE HANDLERS
  // ============================================
  
  /**
   * Обработчик drag over (вызывается постоянно при перетаскивании над элементом)
   */
  function handleDragOver(event: DragEvent, targetSubtask: Subtask): void {
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'move'
    
    // Определяем позицию drop
    const position = determineDropPosition(event, event.currentTarget as HTMLElement)
    
    // Обновляем состояние только если позиция изменилась
    if (position !== dropPosition.value) {
      dropPosition.value = position
    }
    
    dropTargetSubtaskId.value = targetSubtask.id
    
    // Проверяем возможность drop
    if (draggingSubtaskId.value && dropTargetSubtaskId.value) {
      const validation = validateMove(
        draggingSubtaskId.value,
        dropTargetSubtaskId.value,
        dropPosition.value
      )
      canDrop.value = validation.valid
      dropValidationError.value = validation.error || null
    }
  }
  
  /**
   * Обработчик drag enter (вызывается при входе на элемент)
   */
  function handleDragEnter(event: DragEvent, targetSubtask: Subtask): void {
    event.preventDefault()
    console.log(`[useSubtaskDragDrop] 📍 Drag enter: subtask ${targetSubtask.id}`)
    
    // Задержка перед показом drop zone
    if (dropZoneTimer) {
      clearTimeout(dropZoneTimer)
    }
    
    dropZoneTimer = setTimeout(() => {
      dropTargetSubtaskId.value = targetSubtask.id
    }, mergedConfig.dropZoneDelay)
  }
  
  /**
   * Обработчик drag leave (вызывается при выходе с элемента)
   */
  function handleDragLeave(event: DragEvent, targetSubtask: Subtask): void {
    const relatedTarget = event.relatedTarget as HTMLElement | null
    const currentTarget = event.currentTarget as HTMLElement | null
    
    // Проверяем, что уходим действительно с элемента (не на дочерний)
    if (!relatedTarget || !currentTarget || !currentTarget.contains(relatedTarget)) {
      console.log(`[useSubtaskDragDrop] 📤 Drag leave: subtask ${targetSubtask.id}`)
      
      if (dropZoneTimer) {
        clearTimeout(dropZoneTimer)
        dropZoneTimer = null
      }
      
      // Сбрасываем только если уходим с целевого элемента
      if (dropTargetSubtaskId.value === targetSubtask.id) {
        dropTargetSubtaskId.value = null
        dropPosition.value = null
        canDrop.value = false
        dropValidationError.value = null
      }
    }
  }
  
  /**
   * Обработчик drop (вызывается при отпускании над элементом)
   */
  async function handleDrop(event: DragEvent, targetSubtask: Subtask): Promise<void> {
    event.preventDefault()
    event.stopPropagation()
    
    console.log(`[useSubtaskDragDrop] 💧 Drop: subtask ${draggingSubtaskId.value} -> ${targetSubtask.id} (${dropPosition.value})`)
    
    if (!draggingSubtaskId.value || draggingSubtaskId.value === targetSubtask.id) {
      resetDragState()
      return
    }
    
    // Проверяем возможность перемещения
    if (!canDrop.value) {
      if (dropValidationError.value) {
        notifications.warning(dropValidationError.value)
      }
      resetDragState()
      return
    }
    
    try {
      // Выполняем перемещение в зависимости от позиции
      if (dropPosition.value === 'above') {
        await moveSubtaskAbove(draggingSubtaskId.value, targetSubtask.id)
      } else if (dropPosition.value === 'below') {
        await moveSubtaskBelow(draggingSubtaskId.value, targetSubtask.id)
      } else if (dropPosition.value === 'child') {
        await moveSubtaskAsChild(draggingSubtaskId.value, targetSubtask.id)
      }
      
      notifications.success('Подзадача перемещена')
    } catch (error: any) {
      console.error('[useSubtaskDragDrop] ❌ Failed to move subtask:', error)
      notifications.error(error.message || 'Не удалось переместить подзадачу')
    } finally {
      resetDragState()
    }
  }
  
  // ============================================
  // CHILD DROP ZONE HANDLERS
  // ============================================
  
  /**
   * Обработчик drag over для зоны детей (всегда child)
   */
  function handleChildDragOver(event: DragEvent, parentSubtask: Subtask): void {
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'move'
    
    dropTargetSubtaskId.value = parentSubtask.id
    dropPosition.value = 'child'
    
    // Проверяем возможность drop
    if (draggingSubtaskId.value) {
      const validation = validateMove(
        draggingSubtaskId.value,
        parentSubtask.id,
        'child'
      )
      canDrop.value = validation.valid
      dropValidationError.value = validation.error || null
    }
  }
  
  /**
   * Обработчик drop для зоны детей
   */
  async function handleChildDrop(event: DragEvent, parentSubtask: Subtask): Promise<void> {
    event.preventDefault()
    event.stopPropagation()
    
    console.log(`[useSubtaskDragDrop] 💧 Child drop: subtask ${draggingSubtaskId.value} -> ${parentSubtask.id} (child)`)
    
    if (!draggingSubtaskId.value || draggingSubtaskId.value === parentSubtask.id) {
      resetDragState()
      return
    }
    
    // Проверяем возможность перемещения
    if (!canDrop.value) {
      if (dropValidationError.value) {
        notifications.warning(dropValidationError.value)
      }
      resetDragState()
      return
    }
    
    try {
      await moveSubtaskAsChild(draggingSubtaskId.value, parentSubtask.id)
      notifications.success('Подзадача перемещена как дочерняя')
    } catch (error: any) {
      console.error('[useSubtaskDragDrop] ❌ Failed to move subtask as child:', error)
      notifications.error(error.message || 'Не удалось переместить подзадачу')
    } finally {
      resetDragState()
    }
  }
  
  // ============================================
  // MOVE OPERATIONS
  // ============================================
  
  /**
   * Переместить подзадачу выше целевой
   */
  async function moveSubtaskAbove(sourceId: number, targetId: number): Promise<void> {
    const targetSubtask = allSubtasks.value.find(s => s.id === targetId)
    if (!targetSubtask) throw new Error('Целевая подзадача не найдена')
    
    await updateSubtask(sourceId, {
      parentId: targetSubtask.parentId ?? null,
      order: targetSubtask.order
    })
  }
  
  /**
   * Переместить подзадачу ниже целевой
   */
  async function moveSubtaskBelow(sourceId: number, targetId: number): Promise<void> {
    const targetSubtask = allSubtasks.value.find(s => s.id === targetId)
    if (!targetSubtask) throw new Error('Целевая подзадача не найдена')
    
    await updateSubtask(sourceId, {
      parentId: targetSubtask.parentId ?? null,
      order: targetSubtask.order + 1
    })
  }
  
  /**
   * Переместить подзадачу как дочернюю
   */
  async function moveSubtaskAsChild(sourceId: number, parentId: number): Promise<void> {
    await updateSubtask(sourceId, {
      parentId,
      order: 0 // Будет пересчитано на сервере
    })
  }
  
  // ============================================
  // UTILITY
  // ============================================
  
  /**
   * Сбросить всё состояние drag & drop
   */
  function resetDragState(): void {
    isDragging.value = false
    draggingSubtaskId.value = null
    dropTargetSubtaskId.value = null
    dropPosition.value = null
    canDrop.value = false
    dropValidationError.value = null
    dragData.value = null
    
    if (dropZoneTimer) {
      clearTimeout(dropZoneTimer)
      dropZoneTimer = null
    }
  }
  
  /**
   * Получить данные перетаскивания
   */
  function getDragData(): DragData | null {
    return dragData.value
  }
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    isDragging,
    draggingSubtaskId,
    dropTargetSubtaskId,
    dropPosition,
    canDrop,
    dropValidationError,
    
    // Drag Handlers
    handleDragStart,
    handleDragEnd,
    
    // Drop Zone Handlers
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    
    // Child Drop Zone Handlers
    handleChildDragOver,
    handleChildDrop,
    
    // Utility
    resetDragState,
    getDragData
  }
}
