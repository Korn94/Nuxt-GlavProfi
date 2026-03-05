// composables/boards/useSubtaskTree.ts
/**
 * Composable для построения дерева подзадач из flat-списка
 * 
 * Архитектура:
 * - Построение древовидной структуры из flat-массива
 * - Кэширование результатов для оптимизации производительности
 * - Расчёт глубины вложенности для каждой подзадачи
 * - Методы для навигации по дереву (поиск, фильтрация)
 * - Интеграция с subtasksStore
 */

import { ref, computed, watch, type Ref } from 'vue'
import { useSubtasksStore } from 'stores/boards/subtasks'
import type { Subtask, SubtaskTree } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

/**
 * Интерфейс возвращаемых данных composable
 */
export interface UseSubtaskTreeReturn {
  // State
  trees: Ref<Record<number, SubtaskTree[]>>
  isBuilding: Ref<Record<number, boolean>>
  
  // Getters
  getTree: (taskId: number) => SubtaskTree[]
  getSubtaskInTree: (taskId: number, subtaskId: number) => SubtaskTree | null
  getSubtaskDepth: (taskId: number, subtaskId: number) => number
  getSubtaskChildren: (taskId: number, subtaskId: number) => SubtaskTree[]
  getSubtaskParent: (taskId: number, subtaskId: number) => SubtaskTree | null
  getSubtaskAncestors: (taskId: number, subtaskId: number) => SubtaskTree[]
  
  // Actions
  buildTree: (taskId: number) => void
  rebuildTree: (taskId: number) => void
  clearTree: (taskId: number) => void
  clearAllTrees: () => void
  
  // Stats
  getTotalCount: (taskId: number) => number
  getCompletedCount: (taskId: number) => number
  getProgressPercent: (taskId: number) => number
}

/**
 * Конфигурация composable
 */
interface SubtaskTreeConfig {
  /**
   * Максимальная глубина дерева (0-4, всего 5 уровней)
   */
  maxDepth: number
  
  /**
   * Кэшировать ли результаты построения дерева
   */
  enableCache: boolean
  
  /**
   * Автоматически перестраивать дерево при изменениях в store
   */
  autoRebuild: boolean
}

/**
 * Composable для построения дерева подзадач
 * 
 * @example
 * ```ts
 * const {
 *   getTree,
 *   buildTree,
 *   getSubtaskDepth,
 *   getProgressPercent
 * } = useSubtaskTree()
 * 
 * onMounted(() => {
 *   buildTree(taskId.value)
 * })
 * 
 * const tree = computed(() => getTree(taskId.value))
 * ```
 */
export function useSubtaskTree(
  config: Partial<SubtaskTreeConfig> = {}
): UseSubtaskTreeReturn {
  // ============================================
  // CONFIG
  // ============================================
  
  const defaultConfig: SubtaskTreeConfig = {
    maxDepth: MAX_SUBTASK_DEPTH,
    enableCache: true,
    autoRebuild: true
  }
  
  const mergedConfig = { ...defaultConfig, ...config }
  
  // ============================================
  // STORES
  // ============================================
  
  const subtasksStore = useSubtasksStore()
  
  // ============================================
  // STATE
  // ============================================
  
  /**
   * Кэш деревьев по taskId
   * Ключ: taskId, Значение: массив корневых подзадач с детьми
   */
  const trees = ref<Record<number, SubtaskTree[]>>({})
  
  /**
   * Флаги построения деревьев по taskId
   * Ключ: taskId, Значение: идет ли построение
   */
  const isBuilding = ref<Record<number, boolean>>({})
  
  /**
   * Таймеры для debounce перестроения деревьев
   */
  const rebuildTimers = ref<Record<number, NodeJS.Timeout>>({})
  
  // ============================================
  // COMPUTED - Flat подзадачи по taskId
  // ============================================
  
  /**
   * Получить flat-список подзадач для задачи
   */
  const getFlatSubtasks = computed(() => {
    return (taskId: number): Subtask[] => {
      return subtasksStore.getSubtasksByTaskId(taskId)
    }
  })
  
  // ============================================
  // METHODS - Tree Building
  // ============================================
  
  /**
   * Рассчитать глубину подзадачи в дереве
   * @param subtaskId - ID подзадачи
   * @param allSubtasks - Flat-массив всех подзадач
   * @returns Глубина (0 для корневых, 1-4 для вложенных)
   */
  function calculateDepth(
    subtaskId: number,
    allSubtasks: Subtask[]
  ): number {
    const subtask = allSubtasks.find(s => s.id === subtaskId)
    if (!subtask || !subtask.parentId) return 0
    
    let depth = 0
    let currentParentId: number | null = subtask.parentId
    
    while (currentParentId !== null) {
      const parent = allSubtasks.find(s => s.id === currentParentId)
      if (!parent) break
      
      depth++
      currentParentId = parent.parentId ?? null
      
      // Защита от бесконечного цикла
      if (depth > mergedConfig.maxDepth + 2) {
        console.warn(`[useSubtaskTree] ⚠️ Максимальная глубина превышена для подзадачи ${subtaskId}`)
        break
      }
    }
    
    return Math.min(depth, mergedConfig.maxDepth)
  }
  
  /**
   * Построить дерево подзадач для задачи
   * @param taskId - ID задачи
   * @returns Массив корневых подзадач с детьми
   */
  function buildTree(taskId: number): SubtaskTree[] {
    console.log(`[useSubtaskTree] 🌳 Building tree for task ${taskId}`)
    
    isBuilding.value[taskId] = true
    
    try {
      const allSubtasks = getFlatSubtasks.value(taskId)
      
      if (allSubtasks.length === 0) {
        console.log(`[useSubtaskTree] ✅ No subtasks for task ${taskId}`)
        trees.value[taskId] = []
        return []
      }
      
      // Корневые подзадачи (без родителя)
      const roots = allSubtasks.filter(s => s.parentId === null || s.parentId === undefined)
      
      /**
       * Рекурсивное построение детей
       * @param parentId - ID родительской подзадачи
       * @param depth - Текущая глубина
       */
      const buildChildren = (parentId: number, depth: number): SubtaskTree[] => {
        // Проверка максимальной глубины
        if (depth >= mergedConfig.maxDepth) {
          console.warn(
            `[useSubtaskTree] ⚠️ Max depth (${mergedConfig.maxDepth}) reached for parent ${parentId}`
          )
          return []
        }
        
        const children = allSubtasks
          .filter(s => s.parentId === parentId)
          .sort((a, b) => a.order - b.order)
        
        return children.map(child => ({
          ...child,
          depth: depth + 1,
          children: buildChildren(child.id, depth + 1)
        }))
      }
      
      // Строим дерево с корневых элементов
      const tree = roots
        .sort((a, b) => a.order - b.order)
        .map(root => ({
          ...root,
          depth: 0,
          children: buildChildren(root.id, 0)
        }))
      
      // Кэшируем результат
      if (mergedConfig.enableCache) {
        trees.value[taskId] = tree
      }
      
      console.log(
        `[useSubtaskTree] ✅ Tree built for task ${taskId}: ${tree.length} roots, ${allSubtasks.length} total`
      )
      
      return tree
    } catch (error) {
      console.error(`[useSubtaskTree] ❌ Error building tree for task ${taskId}:`, error)
      return []
    } finally {
      isBuilding.value[taskId] = false
    }
  }
  
  /**
   * Перестроить дерево (с debounce)
   * @param taskId - ID задачи
   */
  function rebuildTree(taskId: number): void {
    // Очищаем предыдущий таймер
    if (rebuildTimers.value[taskId]) {
      clearTimeout(rebuildTimers.value[taskId])
    }
    
    // Debounce 100ms для предотвращения частых перестроений
    rebuildTimers.value[taskId] = setTimeout(() => {
      console.log(`[useSubtaskTree] 🔄 Rebuilding tree for task ${taskId}`)
      
      // Очищаем кэш
      if (mergedConfig.enableCache) {
        delete trees.value[taskId]
      }
      
      // Строим заново
      buildTree(taskId)
    }, 100)
  }
  
  /**
   * Очистить дерево из кэша
   * @param taskId - ID задачи
   */
  function clearTree(taskId: number): void {
    console.log(`[useSubtaskTree] 🧹 Clearing tree for task ${taskId}`)
    
    if (rebuildTimers.value[taskId]) {
      clearTimeout(rebuildTimers.value[taskId])
      delete rebuildTimers.value[taskId]
    }
    
    if (mergedConfig.enableCache) {
      delete trees.value[taskId]
    }
  }
  
  /**
   * Очистить все деревья из кэша
   */
  function clearAllTrees(): void {
    console.log(`[useSubtaskTree] 🧹 Clearing all trees`)
    
    // Очищаем все таймеры
    for (const taskId of Object.keys(rebuildTimers.value)) {
      clearTimeout(rebuildTimers.value[Number(taskId)])
    }
    rebuildTimers.value = {}
    
    // Очищаем кэш
    if (mergedConfig.enableCache) {
      trees.value = {}
    }
  }
  
  // ============================================
  // GETTERS - Tree Navigation
  // ============================================
  
  /**
   * Получить дерево для задачи (из кэша или построить)
   */
  function getTree(taskId: number): SubtaskTree[] {
    // Проверяем кэш
    if (mergedConfig.enableCache && trees.value[taskId]) {
      return trees.value[taskId]
    }
    
    // Строим новое дерево
    return buildTree(taskId)
  }
  
  /**
   * Найти подзадачу в дереве по ID
   * @param taskId - ID задачи
   * @param subtaskId - ID подзадачи
   * @returns Подзадача или null
   */
  function getSubtaskInTree(
    taskId: number,
    subtaskId: number
  ): SubtaskTree | null {
    const tree = getTree(taskId)
    
    const findInTree = (nodes: SubtaskTree[]): SubtaskTree | null => {
      for (const node of nodes) {
        if (node.id === subtaskId) {
          return node
        }
        
        if (node.children && node.children.length > 0) {
          const found = findInTree(node.children)
          if (found) return found
        }
      }
      
      return null
    }
    
    return findInTree(tree)
  }
  
  /**
   * Получить глубину подзадачи в дереве
   * @param taskId - ID задачи
   * @param subtaskId - ID подзадачи
   * @returns Глубина (0-4)
   */
  function getSubtaskDepth(
    taskId: number,
    subtaskId: number
  ): number {
    const subtask = getSubtaskInTree(taskId, subtaskId)
    return subtask?.depth ?? 0
  }
  
  /**
   * Получить детей подзадачи
   * @param taskId - ID задачи
   * @param subtaskId - ID подзадачи
   * @returns Массив дочерних подзадач
   */
  function getSubtaskChildren(
    taskId: number,
    subtaskId: number
  ): SubtaskTree[] {
    const subtask = getSubtaskInTree(taskId, subtaskId)
    return subtask?.children ?? []
  }
  
  /**
   * Получить родителя подзадачи
   * @param taskId - ID задачи
   * @param subtaskId - ID подзадачи
   * @returns Родительская подзадача или null
   */
  function getSubtaskParent(
    taskId: number,
    subtaskId: number
  ): SubtaskTree | null {
    const tree = getTree(taskId)
    const subtask = getSubtaskInTree(taskId, subtaskId)
    
    if (!subtask || !subtask.parentId) {
      return null
    }
    
    return getSubtaskInTree(taskId, subtask.parentId)
  }
  
  /**
   * Получить всех предков подзадачи (родитель, дед, и т.д.)
   * @param taskId - ID задачи
   * @param subtaskId - ID подзадачи
   * @returns Массив предков от ближайшего к корню
   */
  function getSubtaskAncestors(
    taskId: number,
    subtaskId: number
  ): SubtaskTree[] {
    const ancestors: SubtaskTree[] = []
    let currentParent = getSubtaskParent(taskId, subtaskId)
    
    while (currentParent) {
      ancestors.unshift(currentParent) // Добавляем в начало
      currentParent = getSubtaskParent(taskId, currentParent.id)
    }
    
    return ancestors
  }
  
  // ============================================
  // STATS - Статистика дерева
  // ============================================
  
  /**
   * Подсчитать общее количество подзадач в дереве
   * @param taskId - ID задачи
   * @returns Общее количество
   */
  function getTotalCount(taskId: number): number {
    const tree = getTree(taskId)
    
    const countNodes = (nodes: SubtaskTree[]): number => {
      let count = 0
      for (const node of nodes) {
        count++
        if (node.children && node.children.length > 0) {
          count += countNodes(node.children)
        }
      }
      return count
    }
    
    return countNodes(tree)
  }
  
  /**
   * Подсчитать количество завершённых подзадач в дереве
   * @param taskId - ID задачи
   * @returns Количество завершённых
   */
  function getCompletedCount(taskId: number): number {
    const tree = getTree(taskId)
    
    const countCompleted = (nodes: SubtaskTree[]): number => {
      let count = 0
      for (const node of nodes) {
        if (node.isCompleted) {
          count++
        }
        if (node.children && node.children.length > 0) {
          count += countCompleted(node.children)
        }
      }
      return count
    }
    
    return countCompleted(tree)
  }
  
  /**
   * Получить процент завершения (все уровни)
   * @param taskId - ID задачи
   * @returns Процент 0-100
   */
  function getProgressPercent(taskId: number): number {
    const total = getTotalCount(taskId)
    if (total === 0) return 0
    
    const completed = getCompletedCount(taskId)
    return Math.round((completed / total) * 100)
  }
  
  // ============================================
  // WATCHERS - Авто-перестроение при изменениях
  // ============================================
  
  /**
   * Отслеживать изменения в subtasksStore и перестраивать деревья
   */
  if (mergedConfig.autoRebuild) {
    watch(
      () => subtasksStore.allSubtasks,
      (newSubtasks, oldSubtasks) => {
        // Определяем какие задачи затронуты изменениями
        const affectedTaskIds = new Set<number>()
        
        // Сравниваем старые и новые подзадачи
        const oldIds = new Set(oldSubtasks?.map(s => s.id) || [])
        const newIds = new Set(newSubtasks.map(s => s.id))
        
        // Новые подзадачи
        for (const subtask of newSubtasks) {
          if (!oldIds.has(subtask.id)) {
            affectedTaskIds.add(subtask.taskId)
          }
        }
        
        // Удалённые подзадачи
        for (const oldSubtask of oldSubtasks || []) {
          if (!newIds.has(oldSubtask.id)) {
            affectedTaskIds.add(oldSubtask.taskId)
          }
        }
        
        // Изменённые подзадачи
        for (const newSubtask of newSubtasks) {
          const oldSubtask = oldSubtasks?.find(s => s.id === newSubtask.id)
          if (oldSubtask && (
            oldSubtask.parentId !== newSubtask.parentId ||
            oldSubtask.order !== newSubtask.order ||
            oldSubtask.isCompleted !== newSubtask.isCompleted
          )) {
            affectedTaskIds.add(newSubtask.taskId)
          }
        }
        
        // Перестраиваем затронутые деревья
        for (const taskId of affectedTaskIds) {
          rebuildTree(taskId)
        }
      },
      { deep: true }
    )
  }
  
  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    trees,
    isBuilding,
    
    // Getters
    getTree,
    getSubtaskInTree,
    getSubtaskDepth,
    getSubtaskChildren,
    getSubtaskParent,
    getSubtaskAncestors,
    
    // Actions
    buildTree,
    rebuildTree,
    clearTree,
    clearAllTrees,
    
    // Stats
    getTotalCount,
    getCompletedCount,
    getProgressPercent
  }
}
