// stores/boards/tasks.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, UpdateTaskData, CreateTaskData } from '~/types/boards'

export const useTasksStore = defineStore('tasks', () => {
  // ============================================
  // STATE
  // ============================================
  /**
   * Flat-массив всех задач
   * ⛔ Не содержит вложенных subtasks - они в отдельном store
   */
  const tasks = ref<Task[]>([])

  /**
   * Задачи по доскам (для быстрой фильтрации)
   */
  const tasksByBoard = ref<Record<number, Task[]>>({})

  /**
   * Статус загрузки
   */
  const loading = ref(false)

  /**
   * Ошибка операции
   */
  const error = ref<string | null>(null)

  /**
   * ID выбранной задачи (для модалки деталей)
   */
  const selectedTaskId = ref<number | null>(null)

  /**
   * ID текущей доски (для контекста операций)
   */
  const currentBoardId = ref<number | null>(null)

  // ============================================
  // GETTERS
  // ============================================
  /**
   * Все задачи (flat)
   */
  const allTasks = computed(() => tasks.value)

  /**
   * Выбранная задача
   */
  const selectedTask = computed(() => {
    if (!selectedTaskId.value) return null
    return tasks.value.find(task => task.id === selectedTaskId.value) || null
  })

  /**
   * Задачи по статусам (для канбан-колонок)
   */
  const tasksByStatus = computed(() => {
    const todo = tasks.value.filter(task => task.status === 'todo')
    const inProgress = tasks.value.filter(task => task.status === 'in_progress')
    const review = tasks.value.filter(task => task.status === 'review')
    const done = tasks.value.filter(task => task.status === 'done')
    const blocked = tasks.value.filter(task => task.status === 'blocked')
    const cancelled = tasks.value.filter(task => task.status === 'cancelled')
    return {
      todo,
      in_progress: inProgress,
      review,
      done,
      blocked,
      cancelled,
      total: tasks.value.length
    }
  })

  /**
   * Статистика задач по приоритетам
   */
  const tasksByPriority = computed(() => {
    const low = tasks.value.filter(task => task.priority === 'low')
    const medium = tasks.value.filter(task => task.priority === 'medium')
    const high = tasks.value.filter(task => task.priority === 'high')
    const urgent = tasks.value.filter(task => task.priority === 'urgent')
    return {
      low: low.length,
      medium: medium.length,
      high: high.length,
      urgent: urgent.length
    }
  })

  /**
   * Общая статистика задач
   */
  const tasksStats = computed(() => {
    return {
      total: tasks.value.length,
      todo: tasksByStatus.value.todo.length,
      in_progress: tasksByStatus.value.in_progress.length,
      review: tasksByStatus.value.review.length,
      done: tasksByStatus.value.done.length,
      blocked: tasksByStatus.value.blocked.length,
      cancelled: tasksByStatus.value.cancelled.length
    }
  })

  /**
   * Задачи конкретной доски
   */
  const getTasksByBoardId = computed(() => {
    return (boardId: number) => tasksByBoard.value[boardId] || []
  })

  // ============================================
  // ACTIONS - State Management
  // ============================================
  /**
   * Установить текущую доску
   */
  function setCurrentBoardId(boardId: number | null) {
    currentBoardId.value = boardId
    console.log(`[TasksStore] 📋 Current board set to: ${boardId}`)
  }

  /**
   * Выбрать задачу (для модалки)
   */
  function selectTask(id: number | null) {
    selectedTaskId.value = id
    console.log(`[TasksStore] 🎯 Task selected: ${id}`)
  }

  // ============================================
  // ACTIONS - HTTP Operations
  // ============================================
  /**
   * Получить все задачи доски
   * 📡 HTTP запрос (начальная загрузка)
   */
  async function fetchTasks(boardId: number): Promise<Task[]> {
    loading.value = true
    error.value = null
    tasks.value = []
    tasksByBoard.value = {}
    try {
      console.log(`[TasksStore] 📥 Fetching tasks for board ${boardId}`)
      const response = await $fetch<{ tasks: Task[]; total: number }>(
        `/api/boards/${boardId}/tasks`,
        { method: 'GET' }
      )
      tasks.value = response.tasks || []
      tasksByBoard.value = { [boardId]: tasks.value }
      setCurrentBoardId(boardId)
      console.log(`[TasksStore] ✅ Fetched ${response.tasks.length} tasks for board ${boardId}`)
      return response.tasks
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке задач'
      console.error('[TasksStore] ❌ Failed to fetch tasks:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Получить задачу по ID
   * 📡 HTTP запрос (для деталей задачи)
   */
  async function fetchTaskById(id: number): Promise<Task> {
    loading.value = true
    error.value = null
    try {
      console.log(`[TasksStore] 📥 Fetching task by ID: ${id}`)
      const response = await $fetch<{ task: Task }>(
        `/api/boards/tasks/${id}`,
        { method: 'GET' }
      )
      // Обновляем задачу в списке или добавляем новую
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        tasks.value[index] = response.task
      } else {
        tasks.value.push(response.task)
      }
      // Также обновляем в tasksByBoard, если задача принадлежит текущей доске
      if (currentBoardId.value) {
        const boardTasks = tasksByBoard.value[currentBoardId.value] || []
        const boardIndex = boardTasks.findIndex(task => task.id === id)
        if (boardIndex !== -1) {
          boardTasks[boardIndex] = response.task
          tasksByBoard.value[currentBoardId.value] = boardTasks
        }
      }
      console.log(`[TasksStore] ✅ Fetched task: ${response.task.id}`)
      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке задачи'
      console.error('[TasksStore] ❌ Failed to fetch task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Создать новую задачу
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function createTask(
    boardId: number,
    data: CreateTaskData
  ): Promise<Task> {
    loading.value = true
    error.value = null
    try {
      console.log('[TasksStore] 📤 Creating task on server...')
      const response = await $fetch<{ success: boolean; task: Task }>(
        `/api/boards/${boardId}/tasks`,
        {
          method: 'POST',
          body: data
        }
      )
      if (!response.task) {
        throw new Error('Failed to create task: no task returned')
      }
      console.log('[TasksStore] ✅ Task created on server:', response.task.id)
      // ⛔ Не добавляем в store здесь - придёт socket событие
      // Это предотвращает дублирование при быстром сокете
      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при создании задачи'
      console.error('[TasksStore] ❌ Failed to create task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Обновить задачу
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function updateTask(
    id: number,
    data: UpdateTaskData
  ): Promise<Task> {
    loading.value = true
    error.value = null
    try {
      console.log(`[TasksStore] 📤 Updating task ${id} on server...`)
      const response = await $fetch<{ success: boolean; task: Task }>(
        `/api/boards/tasks/${id}`,
        {
          method: 'PUT',
          body: data
        }
      )
      if (!response.task) {
        throw new Error('Failed to update task: no task returned')
      }
      console.log(`[TasksStore] ✅ Task ${id} updated on server.`)
      // ⛔ Не обновляем в store здесь - придёт socket событие
      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении задачи'
      console.error('[TasksStore] ❌ Failed to update task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Удалить задачу
   * 📡 HTTP + Socket событие придёт отдельно
   */
  async function deleteTask(id: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      console.log(`[TasksStore] 📤 Deleting task ${id} on server...`)
      await $fetch<{ success: boolean; message: string }>(
        `/api/boards/tasks/${id}`,
        { method: 'DELETE' }
      )
      console.log(`[TasksStore] ✅ Task ${id} deleted on server.`)
      // ⛔ Не удаляем из store здесь - придёт socket событие
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при удалении задачи'
      console.error('[TasksStore] ❌ Failed to delete task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============================================
  // ACTIONS - Optimistic Updates (UI only)
  // ============================================
  /**
   * Обновить задачу оптимистично (до подтверждения сервера)
   * ⚠️ Используется только для UI-операций (drag&drop статусов)
   */
  function updateTaskOptimistic(id: number, data: Partial<Task>) {
    console.log(`[TasksStore] 🔄 Optimistically updating task ${id}:`, data)
    // ✅ ПРОВЕРКА: tasks.value может быть undefined
    if (!tasks.value) return
    
    const globalIndex = tasks.value.findIndex(task => task.id === id)
    if (globalIndex !== -1 && tasks.value[globalIndex]) {
      tasks.value[globalIndex] = { ...tasks.value[globalIndex], ...data }
    }
    
    // ✅ ПРОВЕРКА: currentBoardId.value и tasksByBoard.value могут быть undefined
    if (currentBoardId.value) {
      const boardTasks = tasksByBoard.value[currentBoardId.value]
      if (boardTasks && boardTasks.length > 0) {
        const boardIndex = boardTasks.findIndex(task => task.id === id)
        if (boardIndex !== -1 && boardTasks[boardIndex]) {
          boardTasks[boardIndex] = {
            ...boardTasks[boardIndex],
            ...data
          }
        }
      }
    }
  }

  /**
   * Обновить порядок задач оптимистично (для drag&drop)
   * ✅ ТОЧЕЧНОЕ ОБНОВЛЕНИЕ (in-place) для предотвращения перерисовки
   */
  function updateTasksOrderOptimistic(
    boardId: number,
    orderedTasks: Task[]
  ) {
    console.log(`[TasksStore] 🔄 Optimistically reordering tasks on board ${boardId}`)
    // ✅ ПРОВЕРКА: tasksByBoard.value[boardId] может быть undefined
    const boardTasks = tasksByBoard.value[boardId]
    if (boardTasks && boardTasks.length > 0) {
      boardTasks.forEach(task => {
        const updatedTask = orderedTasks.find(t => t.id === task.id)
        if (updatedTask) {
          task.order = updatedTask.order
          task.status = updatedTask.status
        }
      })
    }
    // ✅ ПРОВЕРКА: tasks.value может быть undefined
    if (tasks.value && tasks.value.length > 0) {
      tasks.value.forEach(task => {
        const updatedTask = orderedTasks.find(t => t.id === task.id)
        if (updatedTask) {
          task.order = updatedTask.order
          task.status = updatedTask.status
        }
      })
    }
  }

  // ============================================
  // ACTIONS - Socket Event Handlers
  // ============================================
  /**
   * Обработка события создания задачи (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleTaskCreated(task: Task) {
    console.log(`[TasksStore] 📡 Socket: task:created ${task.id}`)
    const exists = tasks.value.some(t => t.id === task.id)
    if (!exists) {
      tasks.value = [...tasks.value, task]
      if (task.boardId) {
        if (!tasksByBoard.value[task.boardId]) {
          tasksByBoard.value[task.boardId] = []
        }
        // ✅ ПРОВЕРКА: tasksByBoard.value[task.boardId] может быть undefined
        const boardTasks = tasksByBoard.value[task.boardId] || []
        const boardExists = boardTasks.some(t => t.id === task.id)
        if (!boardExists) {
          tasksByBoard.value[task.boardId] = [
            ...boardTasks,
            task
          ]
        }
      }
      console.log(`[TasksStore] ✅ Added task ${task.id} to store`)
    } else {
      console.log(`[TasksStore] ⚠️ Task ${task.id} already exists`)
    }
  }

  /**
   * Обработка события обновления задачи (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleTaskUpdated(task: Task) {
    console.log(`[TasksStore] 📡 Socket: task:updated ${task.id}`)
    
    // Обновляем в глобальном списке
    const globalIndex = tasks.value.findIndex(t => t.id === task.id)
    if (globalIndex !== -1) {
      tasks.value = [
        ...tasks.value.slice(0, globalIndex),
        task,
        ...tasks.value.slice(globalIndex + 1)
      ]
    } else {
      tasks.value = [...tasks.value, task]
    }
    
    // ✅ ИСПРАВЛЕНО: Обновляем в списке по доске с проверками
    if (task.boardId) {
      // ✅ Сохраняем массив в переменную с fallback на пустой массив
      const boardTasks = tasksByBoard.value[task.boardId] ?? []
      
      const boardIndex = boardTasks.findIndex(t => t.id === task.id)
      if (boardIndex !== -1) {
        // Обновляем существующую задачу
        tasksByBoard.value[task.boardId] = [
          ...boardTasks.slice(0, boardIndex),
          task,
          ...boardTasks.slice(boardIndex + 1)
        ]
      } else {
        // Добавляем новую задачу в список доски
        tasksByBoard.value[task.boardId] = [
          ...boardTasks,
          task
        ]
      }
    }
    
    console.log(`[TasksStore] ✅ Updated task ${task.id} in store`)
  }

  /**
   * Обработка события удаления задачи (от Socket)
   * 📡 Вызывается из SocketService
   */
  function handleTaskDeleted(taskId: number) {
    console.log(`[TasksStore] 📡 Socket: task:deleted ${taskId}`)
    // Находим задачу для получения boardId
    const task = tasks.value.find(t => t.id === taskId)
    const boardId = task?.boardId
    // Удаляем из глобального списка
    tasks.value = tasks.value.filter(t => t.id !== taskId)
    // Удаляем из списка по доске
    if (boardId && tasksByBoard.value[boardId]) {
      tasksByBoard.value[boardId] = tasksByBoard.value[boardId].filter(
        t => t.id !== taskId
      )
    }
    // Если удалённая задача была выбрана, сбрасываем выбор
    if (selectedTaskId.value === taskId) {
      selectedTaskId.value = null
    }
    console.log(`[TasksStore] ✅ Deleted task ${taskId} from store`)
  }

  /**
   * ✅ ОБРАБОТКА СОБЫТИЯ ИЗМЕНЕНИЯ ПОРЯДКА ЗАДАЧ (ОТ SOCKET)
   * 📡 Вызывается из SocketService при reorder внутри колонки
   */
  function handleTasksReordered(data: {
    boardId: number
    status: string
    tasks: Array<{ id: number; order: number }>
  }) {
    console.log(`[TasksStore] 📡 Socket: tasks:reordered в колонке "${data.status}"`, data.tasks)
    
    // ✅ ПРОВЕРКА: tasksByBoard.value[data.boardId] может быть undefined
    const boardTasks = tasksByBoard.value[data.boardId]
    if (boardTasks && boardTasks.length > 0) {
      boardTasks.forEach(task => {
        const reorderInfo = data.tasks.find(t => t.id === task.id)
        if (reorderInfo) {
          task.order = reorderInfo.order
        }
      })
    }
    
    // ✅ ПРОВЕРКА: tasks.value может быть undefined
    if (tasks.value && tasks.value.length > 0) {
      tasks.value.forEach(task => {
        if (task.boardId === data.boardId) {
          const reorderInfo = data.tasks.find(t => t.id === task.id)
          if (reorderInfo) {
            task.order = reorderInfo.order
          }
        }
      })
    }
    
    console.log(`[TasksStore] ✅ Порядок задач обновлён для доски ${data.boardId}`)
  }

  // ============================================
  // ACTIONS - Utility
  // ============================================
  /**
   * Очистить состояние store
   */
  function clearState() {
    console.log('[TasksStore] 🧹 Clearing state')
    tasks.value = []
    tasksByBoard.value = {}
    selectedTaskId.value = null
    error.value = null
    currentBoardId.value = null
  }

  /**
   * Очистить задачи конкретной доски
   */
  function clearBoardTasks(boardId: number) {
    console.log(`[TasksStore] 🧹 Clearing tasks for board ${boardId}`)
    tasks.value = tasks.value.filter(t => t.boardId !== boardId)
    delete tasksByBoard.value[boardId]
  }

  // ============================================
  // RETURN
  // ============================================
  return {
    // State
    tasks,
    tasksByBoard,
    loading,
    error,
    selectedTaskId,
    currentBoardId,
    // Getters
    allTasks,
    selectedTask,
    tasksByStatus,
    tasksByPriority,
    tasksStats,
    getTasksByBoardId,
    // Actions - State Management
    setCurrentBoardId,
    selectTask,
    // Actions - HTTP
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    // Actions - Optimistic
    updateTaskOptimistic,
    updateTasksOrderOptimistic,
    // Actions - Socket
    handleTaskCreated,
    handleTaskUpdated,
    handleTaskDeleted,
    handleTasksReordered, // ✅ ДОБАВЛЕНО
    // Actions - Utility
    clearState,
    clearBoardTasks
  }
})
