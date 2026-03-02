// stores/boards/tasks.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSubtasksStore } from './subtasks' // Импортируем стор подзадач
import type { Task, UpdateTaskData, CreateTaskData } from '~/types/boards'

export const useTasksStore = defineStore('tasks', () => {
  // ============ STATE ============
  const tasks = ref<Task[]>([])
  const tasksByBoard = ref<Record<number, Task[]>>({});
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedTaskId = ref<number | null>(null)
  const currentBoardId = ref<number | null>(null) // Для отслеживания текущей доски

  // ============ GETTERS ============
  const allTasks = computed(() => tasks.value)

  const selectedTask = computed(() => {
    if (!selectedTaskId.value) return null
    return tasks.value.find(task => task.id === selectedTaskId.value) || null
  })

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

  // Геттер для статистики задач по приоритетам
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

  // Геттер для общей статистики задач
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

  // ============ ACTIONS ============

  // Установить текущую доску
  function setCurrentBoardId(boardId: number | null) {
    currentBoardId.value = boardId
  }

  // Получить все задачи доски
  async function fetchTasks(boardId: number) {
    loading.value = true
    error.value = null
    tasks.value = [] // Очищаем общее состояние задач
    tasksByBoard.value = {}; // Очищаем задачи по доске

    try {
      console.log(`[TasksStore] 📥 Fetching tasks for board ${boardId}`)
      const response = await $fetch<{ tasks: Task[], total: number }>(`/api/boards/${boardId}/tasks`, {
        method: 'GET'
      })

      console.log(`[TasksStore] ✅ Fetched ${response.tasks.length} tasks for board ${boardId}`)
      tasks.value = response.tasks || []

      // Заполняем tasksByBoard
      tasksByBoard.value = { [boardId]: tasks.value }
      setCurrentBoardId(boardId) // Устанавливаем текущую доску

    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке задач'
      console.error('Failed to fetch tasks:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Получить задачу по ID
  async function fetchTaskById(id: number) {
    loading.value = true
    error.value = null

    try {
      console.log(`[TasksStore] 📥 Fetching task by ID: ${id}`)
      const response = await $fetch<{ task: Task }>(`/api/tasks/${id}`, {
        method: 'GET'
      })

      console.log(`[TasksStore] ✅ Fetched task: ${response.task.id}`)

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

      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке задачи'
      console.error('Failed to fetch task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Создать новую задачу (оптимистичное обновление)
  async function createTask(boardId: number, data: CreateTaskData) {
    loading.value = true
    error.value = null

    try {
      console.log('[TasksStore] 📤 Creating task on server...')
      const response = await $fetch<{ success: boolean; task: Task }>(`/api/boards/${boardId}/tasks`, {
        method: 'POST',
        body: data
      })
      console.log('[TasksStore] ✅ Task created on server:', response.task?.id)

      if (!response.task) {
        throw new Error('Failed to create task: no task returned')
      }

      // Оптимистичное обновление: добавляем задачу локально сразу
      if (!boardId || !tasksByBoard.value[boardId]) {
        tasksByBoard.value[boardId] = []
      }

      // Проверяем, нет ли уже такой задачи (на случай быстрого сокета)
      const exists = tasksByBoard.value[boardId].find(t => t.id === response.task!.id)
      if (!exists) {
        console.log('[TasksStore] ➕ Adding task locally (optimistic)')
        tasksByBoard.value[boardId] = [...tasksByBoard.value[boardId], response.task]
        // Добавляем также в глобальный список
        tasks.value = [...tasks.value, response.task]
      } else {
        console.log('[TasksStore] ⚠️ Task already added via socket')
      }

      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при создании задачи'
      console.error('Failed to create task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Обновить задачу (оптимистичное обновление)
  async function updateTask(id: number, data: UpdateTaskData) {
    loading.value = true
    error.value = null

    try {
      console.log(`[TasksStore] 📤 Updating task ${id} on server...`)
      const response = await $fetch<{ success: boolean, task: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: data
      })
      console.log(`[TasksStore] ✅ Task ${id} updated on server.`)

      if (!response.task) {
        throw new Error('Failed to update task: no task returned')
      }

      // Обновляем задачу в глобальном списке
      const globalIndex = tasks.value.findIndex(task => task.id === id)
      if (globalIndex !== -1) {
        tasks.value[globalIndex] = response.task
      }

      // Обновляем задачу в списке по доске
      if (currentBoardId.value && tasksByBoard.value[currentBoardId.value]) {
        const boardIndex = tasksByBoard.value[currentBoardId.value].findIndex(task => task.id === id)
        if (boardIndex !== -1) {
          tasksByBoard.value[currentBoardId.value][boardIndex] = response.task
        }
      }

      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении задачи'
      console.error('Failed to update task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Удалить задачу
  async function deleteTask(id: number) {
    loading.value = true
    error.value = null

    try {
      console.log(`[TasksStore] 📤 Deleting task ${id} on server...`)
      await $fetch<{ success: boolean, message: string }>(`/api/tasks/${id}`, {
        method: 'DELETE'
      })
      console.log(`[TasksStore] ✅ Task ${id} deleted on server.`)

      // Удаляем задачу из глобального списка
      tasks.value = tasks.value.filter(task => task.id !== id)

      // Удаляем задачу из списка по доске
      if (currentBoardId.value && tasksByBoard.value[currentBoardId.value]) {
        tasksByBoard.value[currentBoardId.value] = tasksByBoard.value[currentBoardId.value].filter(task => task.id !== id)
      }

      // Если удалённая задача была выбрана, сбрасываем выбор
      if (selectedTaskId.value === id) {
        selectedTaskId.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при удалении задачи'
      console.error('Failed to delete task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Выбрать задачу
  function selectTask(id: number | null) {
    selectedTaskId.value = id
  }

  // Очистить состояние
  function clearState() {
    tasks.value = []
    tasksByBoard.value = {}
    selectedTaskId.value = null
    error.value = null
    currentBoardId.value = null
  }

  // --- МЕТОДЫ ДЛЯ ОПТИМИСТИЧЕСКОГО ОБНОВЛЕНИЯ ---
  // Обновить задачу оптимистично (до подтверждения сервера)
  async function updateTaskOptimistic(id: number, data: Partial<Task>) {
    console.log(`[TasksStore] 🔄 Optimistically updating task ${id}:`, data)

    // Обновляем в глобальном списке
    const globalIndex = tasks.value.findIndex(task => task.id === id)
    if (globalIndex !== -1) {
      tasks.value[globalIndex] = { ...tasks.value[globalIndex], ...data }
    }

    // Обновляем в списке по доске
    if (currentBoardId.value && tasksByBoard.value[currentBoardId.value]) {
      const boardIndex = tasksByBoard.value[currentBoardId.value].findIndex(task => task.id === id)
      if (boardIndex !== -1) {
        tasksByBoard.value[currentBoardId.value][boardIndex] = {
          ...tasksByBoard.value[currentBoardId.value][boardIndex],
          ...data
        }
      }
    }
  }

  // Обновить порядок задач оптимистично
  function updateTasksOrderOptimistic(boardId: number, orderedTasks: Task[]) {
    console.log(`[TasksStore] 🔄 Optimistically reordering tasks on board ${boardId}`)
    tasksByBoard.value[boardId] = orderedTasks.map((task, index) => ({
      ...task,
      order: index
    }))
  }

  // --- МЕТОДЫ ДЛЯ ОБНОВЛЕНИЯ ПОДЗАДАЧ ---
  // Обновить подзадачи задачи, используя актуальное состояние из subtasksStore
  function updateTaskSubtasksFromStore(taskId: number) {
      console.log(`[TasksStore] 🔄 Syncing subtasks for task ${taskId} from subtasks store.`)
      
      const subtasksStore = useSubtasksStore()
      const updatedSubtasks = subtasksStore.getSubtasksByTaskId(taskId)
      
      // ✅ Правильно: создаём НОВЫЙ массив задач, а не мутируем существующий
      tasks.value = tasks.value.map(task =>
          task.id === taskId
              ? {
                  ...task,
                  subtasks: [...updatedSubtasks], // Глубокая копия
              }
              : task
      )
      
      // Также обновляем по доскам
      for (const [boardIdStr, taskList] of Object.entries(tasksByBoard.value)) {
          const boardId = Number(boardIdStr)
          
          tasksByBoard.value = {
              ...tasksByBoard.value,
              [boardId]: taskList.map(t =>
                  t.id === taskId
                      ? {
                          ...t,
                          subtasks: [...updatedSubtasks],
                      }
                      : t
              )
          }
      }
      
      console.log(`[TasksStore] ✅ Updated subtasks for task ${taskId} (count: ${updatedSubtasks.length})`)
  }


  // ============ ВОЗВРАТ ============

  return {
    // State
    tasks,
    tasksByBoard, // Добавляем tasksByBoard в возвращаемый объект
    loading,
    error,
    selectedTaskId,
    currentBoardId, // Возвращаем currentBoardId

    // Getters
    allTasks,
    selectedTask,
    tasksByStatus,
    tasksByPriority,
    tasksStats,

    // Actions
    setCurrentBoardId,
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    selectTask,
    clearState,
    updateTaskOptimistic,
    updateTasksOrderOptimistic,
    updateTaskSubtasksFromStore, // Возвращаем новый метод
  }
})
