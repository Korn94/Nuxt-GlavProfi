// stores/boards/subtasks.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Subtask, SubtaskTree, SubtaskStats, CreateSubtaskData, UpdateSubtaskData } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

export const useSubtasksStore = defineStore('subtasks', () => {
  // ============================================
  // STATE
  // ============================================
  
  /**
   * Flat-массив всех подзадач
   * ⛔ Не содержит вложенных subtasks - дерево строится на клиенте
   */
  const subtasks = ref<Subtask[]>([])
  
  /**
   * Статус загрузки
   */
  const loading = ref(false)
  
  /**
   * Ошибка операции
   */
  const error = ref<string | null>(null)
  
  /**
   * ID текущей подписанной доски
   */
  const subscribedBoardId = ref<number | null>(null)
  
  /**
   * Кэш деревьев подзадач по taskId (для оптимизации)
   */
  const treeCache = ref<Record<number, SubtaskTree[]>>({})

  // ============================================
  // GETTERS
  // ============================================
  
  /**
   * Все подзадачи (flat)
   */
  const allSubtasks = computed(() => subtasks.value)
  
  /**
   * Получить подзадачи задачи (flat список)
   */
  const getSubtasksByTaskId = computed(() => {
    return (taskId: number) => subtasks.value.filter(s => s.taskId === taskId)
  })
  
  /**
   * Получить одну подзадачу по ID
   */
  const getSubtaskById = computed(() => {
    return (subtaskId: number) => subtasks.value.find(s => s.id === subtaskId) || null
  })
  
  /**
   * Построить дерево подзадач для задачи
   * ✅ Кэшируется для оптимизации
   */
  const buildSubtaskTree = (taskId: number): SubtaskTree[] => {
    // Проверяем кэш
    if (treeCache.value[taskId]) {
      return treeCache.value[taskId]
    }
    
    const taskSubtasks = subtasks.value.filter(s => s.taskId === taskId)
    
    // Корневые подзадачи (без родителя)
    const roots = taskSubtasks.filter(s => s.parentId === null)
    
    /**
     * Рекурсивное построение дерева
     * @param parentId - ID родительской подзадачи
     * @param depth - Текущая глубина вложенности
     */
    const buildChildren = (parentId: number, depth: number = 0): SubtaskTree[] => {
      // Проверка максимальной глубины
      if (depth > MAX_SUBTASK_DEPTH) {
        console.warn(`[SubtasksStore] Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH}) достигнута`)
        return []
      }
      
      const children = taskSubtasks
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
    treeCache.value[taskId] = tree
    
    return tree
  }
  
  /**
   * Получить статистику подзадач задачи
   * ⚠️ Считает только первый уровень (по требованиям)
   */
  const getSubtaskStats = computed(() => {
    return (taskId: number): SubtaskStats => {
      const taskSubtasks = subtasks.value.filter(s => s.taskId === taskId && s.parentId === null)
      const total = taskSubtasks.length
      const completed = taskSubtasks.filter(s => s.isCompleted).length
      return {
        total,
        completed,
        progress: total ? Math.round((completed / total) * 100) : 0
      }
    }
  })
  
  /**
   * Проверить максимальную глубину для подзадачи
   */
  const getMaxDepthForSubtask = computed(() => {
    return (parentId: number | null): number => {
      if (parentId === null) return 0
      let depth = 0
      let currentParentId: number | null = parentId  // ✅ Добавили | null
      while (currentParentId !== null) {
        const parent = subtasks.value.find(s => s.id === currentParentId)
        if (!parent) break
        depth++
        currentParentId = parent.parentId ?? null  // ✅ Явно обрабатываем null
      }
      return depth
    }
  })
  
  /**
   * Можно ли добавить дочернюю подзадачу (проверка глубины)
   */
  const canAddChildSubtask = computed(() => {
    return (parentId: number | null): boolean => {
      const depth = getMaxDepthForSubtask.value(parentId)
      return depth < MAX_SUBTASK_DEPTH
    }
  })

  // ============================================
  // ACTIONS - HTTP Operations
  // ============================================
  
  /**
   * Загрузить подзадачи задачи
   * 📡 HTTP запрос (только для начальной загрузки)
   */
  async function fetchSubtasks(taskId: number): Promise<Subtask[]> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[SubtasksStore] 📥 Fetching subtasks for task ${taskId}`)
      
      const response = await $fetch<{ subtasks: Subtask[] }>(
        `/api/boards/tasks/${taskId}/subtasks`,
        { method: 'GET' }
      )
      
      // ⛔ Не очищаем весь store - добавляем только новые
      // Это важно для работы с несколькими задачами одновременно
      const existingIds = new Set(subtasks.value.map(s => s.id))
      const newSubtasks = response.subtasks.filter(s => !existingIds.has(s.id))
      
      if (newSubtasks.length > 0) {
        subtasks.value = [...subtasks.value, ...newSubtasks]
        console.log(`[SubtasksStore] ✅ Added ${newSubtasks.length} new subtasks`)
      }
      
      // Очищаем кэш дерева для этой задачи
      delete treeCache.value[taskId]
      
      return response.subtasks
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка загрузки подзадач'
      console.error('[SubtasksStore] ❌ Failed to fetch subtasks:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Создать подзадачу
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function createSubtask(
    taskId: number,
    data: CreateSubtaskData
  ): Promise<Subtask> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[SubtasksStore] 📤 Creating subtask for task ${taskId}`, data)
      
      // Проверка максимальной глубины
      if (data.parentId !== null && data.parentId !== undefined) {
        const depth = getMaxDepthForSubtask.value(data.parentId)
        if (depth >= MAX_SUBTASK_DEPTH) {
          throw new Error(`Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH}) достигнута`)
        }
      }
      
      const response = await $fetch<{ success: boolean; subtask: Subtask }>(
        `/api/boards/tasks/${taskId}/subtasks`,
        {
          method: 'POST',
          body: {
            title: data.title,
            description: data.description ?? null,
            parentId: data.parentId ?? null,
            order: data.order ?? 0
          }
        }
      )
      
      if (!response.subtask) {
        throw new Error('Не удалось создать подзадачу: пустой ответ')
      }
      
      console.log(`[SubtasksStore] ✅ Subtask created: ${response.subtask.id}`)
      
      // ⛔ Не добавляем в store здесь - придёт socket событие
      // Это предотвращает дублирование при быстром сокете
      
      return response.subtask
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка создания подзадачи'
      console.error('[SubtasksStore] ❌ Failed to create subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Обновить подзадачу
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function updateSubtask(
    id: number,
    data: UpdateSubtaskData
  ): Promise<Subtask> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[SubtasksStore] 📤 Updating subtask ${id}`, data)
      
      // Проверка циклической зависимости при смене родителя
      if (data.parentId !== undefined && data.parentId !== null) {
        if (await hasCircularDependency(id, data.parentId)) {
          throw new Error('Обнаружена циклическая зависимость: нельзя сделать подзадачу дочерней самой себя или своего потомка')
        }
        
        // Проверка максимальной глубины
        const depth = getMaxDepthForSubtask.value(data.parentId)
        if (depth >= MAX_SUBTASK_DEPTH) {
          throw new Error(`Максимальная глубина вложенности (${MAX_SUBTASK_DEPTH}) достигнута`)
        }
      }
      
      const response = await $fetch<{ success: boolean; subtask: Subtask }>(
        `/api/boards/subtasks/${id}`,
        {
          method: 'PUT',
          body: {
            title: data.title,
            description: data.description,
            parentId: data.parentId,
            order: data.order,
            isCompleted: data.isCompleted
          }
        }
      )
      
      if (!response.subtask) {
        throw new Error('Не удалось обновить подзадачу: пустой ответ')
      }
      
      console.log(`[SubtasksStore] ✅ Subtask updated: ${response.subtask.id}`)
      
      // ⛔ Не обновляем в store здесь - придёт socket событие
      
      return response.subtask
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка обновления подзадачи'
      console.error('[SubtasksStore] ❌ Failed to update subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Завершить/развернуть подзадачу
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function completeSubtask(
    id: number,
    isCompleted?: boolean,
    updateChildren: boolean = false
  ): Promise<Subtask> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[SubtasksStore] 📤 Completing subtask ${id}`, { isCompleted, updateChildren })
      
      const existingSubtask = getSubtaskById.value(id)
      if (!existingSubtask) {
        throw new Error('Подзадача не найдена')
      }
      
      const newStatus = isCompleted !== undefined ? isCompleted : !existingSubtask.isCompleted
      
      const response = await $fetch<{ success: boolean; subtask: Subtask }>(
        `/api/boards/subtasks/${id}/complete`,
        {
          method: 'PUT',
          body: {
            isCompleted: newStatus,
            updateChildren
          }
        }
      )
      
      if (!response.subtask) {
        throw new Error('Не удалось изменить статус подзадачи: пустой ответ')
      }
      
      console.log(`[SubtasksStore] ✅ Subtask completed: ${response.subtask.id}`)
      
      // ⛔ Не обновляем в store здесь - придёт socket событие
      
      return response.subtask
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка изменения статуса подзадачи'
      console.error('[SubtasksStore] ❌ Failed to complete subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Удалить подзадачу
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function deleteSubtask(id: number): Promise<void> {
    loading.value = true
    error.value = null
    
    try {
      console.log(`[SubtasksStore] 📤 Deleting subtask ${id}`)
      
      await $fetch<{ success: boolean; message: string }>(
        `/api/boards/subtasks/${id}`,
        { method: 'DELETE' }
      )
      
      console.log(`[SubtasksStore] ✅ Subtask deleted: ${id}`)
      
      // ⛔ Не удаляем из store здесь - придёт socket событие
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка удаления подзадачи'
      console.error('[SubtasksStore] ❌ Failed to delete subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ACTIONS - Socket Event Handlers
  // ============================================
  
  /**
   * Обработка события создания подзадачи (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleSubtaskCreated(subtask: Subtask) {
    console.log(`[SubtasksStore] 📡 Socket: subtask:created ${subtask.id}`)
    
    const exists = subtasks.value.some(s => s.id === subtask.id)
    if (!exists) {
      subtasks.value = [...subtasks.value, subtask]
      
      // Очищаем кэш дерева для этой задачи
      delete treeCache.value[subtask.taskId]
      
      console.log(`[SubtasksStore] ✅ Added subtask ${subtask.id} to store`)
    } else {
      console.log(`[SubtasksStore] ⚠️ Subtask ${subtask.id} already exists`)
    }
  }
  
  /**
   * Обработка события обновления подзадачи (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleSubtaskUpdated(subtask: Subtask) {
    console.log(`[SubtasksStore] 📡 Socket: subtask:updated ${subtask.id}`)
    
    const index = subtasks.value.findIndex(s => s.id === subtask.id)
    
    if (index !== -1) {
      // Обновляем существующую
      subtasks.value = [
        ...subtasks.value.slice(0, index),
        subtask,
        ...subtasks.value.slice(index + 1)
      ]
      
      // Очищаем кэш дерева для этой задачи
      delete treeCache.value[subtask.taskId]
      
      console.log(`[SubtasksStore] ✅ Updated subtask ${subtask.id} in store`)
    } else {
      // Добавляем новую (если пришла но не была в store)
      subtasks.value = [...subtasks.value, subtask]
      delete treeCache.value[subtask.taskId]
      
      console.log(`[SubtasksStore] ✅ Added subtask ${subtask.id} to store (was missing)`)
    }
  }
  
  /**
   * Обработка события удаления подзадачи (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleSubtaskDeleted(subtaskId: number, taskId: number) {
    console.log(`[SubtasksStore] 📡 Socket: subtask:deleted ${subtaskId}`)
    
    // Собираем все ID для удаления (сама подзадача + все дочерние)
    const collectIds = (id: number): number[] => {
      const children = subtasks.value.filter(s => s.parentId === id)
      return children.reduce<number[]>(
        (acc, c) => [...acc, c.id, ...collectIds(c.id)],
        [id]
      )
    }
    
    const idsToDelete = collectIds(subtaskId)
    const beforeCount = subtasks.value.length
    
    subtasks.value = subtasks.value.filter(s => !idsToDelete.includes(s.id))
    
    // Очищаем кэш дерева для этой задачи
    delete treeCache.value[taskId]
    
    console.log(`[SubtasksStore] ✅ Deleted ${beforeCount - subtasks.value.length} subtasks (including children)`)
  }

  // ============================================
  // ACTIONS - Subscription Management
  // ============================================
  
  /**
   * Подписаться на обновления доски
   */
  function subscribeToBoard(boardId: number) {
    if (subscribedBoardId.value === boardId) {
      console.log(`[SubtasksStore] ⚠️ Already subscribed to board ${boardId}`)
      return
    }
    
    console.log(`[SubtasksStore] 🔔 Subscribing to board ${boardId}`)
    subscribedBoardId.value = boardId
  }
  
  /**
   * Отписаться от обновлений доски
   */
  function unsubscribeFromBoard() {
    if (subscribedBoardId.value === null) return
    
    console.log(`[SubtasksStore] 📴 Unsubscribing from board ${subscribedBoardId.value}`)
    subscribedBoardId.value = null
  }

  // ============================================
  // ACTIONS - Utility
  // ============================================
  
  /**
   * Проверка на циклическую зависимость
   * @param subtaskId - ID подзадачи которую перемещаем
   * @param potentialParentId - ID потенциального родителя
   */
  async function hasCircularDependency(
    subtaskId: number,
    potentialParentId: number
  ): Promise<boolean> {
    // Рекурсивно проверяем, не является ли potentialParentId потомком subtaskId
    const checkAncestors = (currentId: number): boolean => {
      const currentSubtask = subtasks.value.find(s => s.id === currentId)
      if (!currentSubtask) return false
      
      if (currentSubtask.parentId === subtaskId) {
        return true // Цикл обнаружен
      }
      
      if (currentSubtask.parentId) {
        return checkAncestors(currentSubtask.parentId)
      }
      
      return false
    }
    
    return checkAncestors(potentialParentId)
  }
  
  /**
   * Очистить состояние store
   */
  function clearState() {
    console.log('[SubtasksStore] 🧹 Clearing state')
    subtasks.value = []
    treeCache.value = {}
    error.value = null
    subscribedBoardId.value = null
  }
  
  /**
   * Очистить подзадачи конкретной задачи
   */
  function clearTaskSubtasks(taskId: number) {
    console.log(`[SubtasksStore] 🧹 Clearing subtasks for task ${taskId}`)
    subtasks.value = subtasks.value.filter(s => s.taskId !== taskId)
    delete treeCache.value[taskId]
  }

  // ============================================
  // RETURN
  // ============================================
  
  return {
    // State
    subtasks,
    loading,
    error,
    subscribedBoardId,
    
    // Getters
    allSubtasks,
    getSubtasksByTaskId,
    getSubtaskById,
    buildSubtaskTree,
    getSubtaskStats,
    getMaxDepthForSubtask,
    canAddChildSubtask,
    
    // Actions - HTTP
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    completeSubtask,
    deleteSubtask,
    
    // Actions - Socket
    handleSubtaskCreated,
    handleSubtaskUpdated,
    handleSubtaskDeleted,
    
    // Actions - Subscription
    subscribeToBoard,
    unsubscribeFromBoard,
    
    // Actions - Utility
    hasCircularDependency,
    clearState,
    clearTaskSubtasks
  }
})
