// stores/boards/tasks.ts
import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { useSocketStore } from '../socket'
import type { Task, CreateTaskData, UpdateTaskData } from '~/types/boards'

export const useTasksStore = defineStore('tasks', () => {
  // ============ STATE ============
  const tasksByBoard = reactive<Record<number, Task[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedTaskId = ref<number | null>(null)
  const currentBoardId = ref<number | null>(null)
  const isSubscribed = ref(false)

  // ============ SOCKET INTEGRATION ============
  const socketStore = useSocketStore()

  // Подписка на события доски
  const subscribeToBoard = (boardId: number) => {
    console.log(`[TasksStore] 🔄 Subscribing to board ${boardId}`)

    if (isSubscribed.value && currentBoardId.value && currentBoardId.value !== boardId) {
      unsubscribeFromBoard(currentBoardId.value)
    }

    currentBoardId.value = boardId

    const waitForSocket = (attempts = 0) => {
      if (socketStore.socket?.connected) {
        console.log(`[TasksStore] ✅ Socket connected, subscribing to board ${boardId}`)

        // ✅ ОБРАБОТЧИК СОЗДАНИЯ ЗАДАЧИ С ЗАЩИТОЙ ОТ ДУБЛЕЙ
        socketStore.on(`board:${boardId}:task:created`, (data: { task: Task }) => {
          console.log('[TasksStore] 🆕 Task created via socket:', data.task.id)

          if (!tasksByBoard[boardId]) {
            tasksByBoard[boardId] = []
          }

          // ✅ ПРОВЕРЯЕМ, НЕТ ЛИ УЖЕ ТАКОЙ ЗАДАЧИ
          const exists = tasksByBoard[boardId].find(t => t.id === data.task.id)

          if (!exists) {
            console.log('[TasksStore] ➕ Adding task to board')
            tasksByBoard[boardId] = [data.task, ...tasksByBoard[boardId]]
          } else {
            console.log('[TasksStore] ⚠️ Task already exists (added optimistically), updating it')
            // Обновляем на случай, если локальная версия отличается от серверной
            const index = tasksByBoard[boardId].findIndex(t => t.id === data.task.id)
            if (index !== -1) {
              tasksByBoard[boardId][index] = data.task
            }
          }
        })

        socketStore.on(`board:${boardId}:task:updated`, (data: { taskId: number; task: Task }) => {
          console.log('[TasksStore] 🔄 Task updated via socket:', data.taskId)
          if (tasksByBoard[boardId]) {
            const index = tasksByBoard[boardId].findIndex(task => task.id === data.taskId)
            if (index !== -1) {
              // ✅ СОХРАНЯЕМ ПОДЗАДАЧИ ИЗ ТЕКУЩЕГО СОСТОЯНИЯ
              const currentSubtasks = tasksByBoard[boardId][index].subtasks

              tasksByBoard[boardId][index] = {
                ...tasksByBoard[boardId][index],
                ...data.task,
                // ✅ Восстанавливаем подзадачи если их нет в обновлении
                subtasks: data.task.subtasks || currentSubtasks || []
              }
            }
          }
        })

        socketStore.on(`board:${boardId}:tasks:updated`, (data: { tasks: Task[] }) => {
          console.log('[TasksStore] 🔄 Multiple tasks updated via socket:', data.tasks.length)
          const currentTasks = tasksByBoard[boardId] || []

          // ✅ СОХРАНЯЕМ ПОДЗАДАЧИ ДЛЯ ВСЕХ ЗАДАЧ
          const updatedTasks = data.tasks.map(updatedTask => {
            const currentTask = currentTasks.find(t => t.id === updatedTask.id)
            return {
              ...updatedTask,
              subtasks: updatedTask.subtasks || currentTask?.subtasks || []
            }
          })

          tasksByBoard[boardId] = updatedTasks
        })

        socketStore.on(`board:${boardId}:task:deleted`, (data: { taskId: number }) => {
          console.log('[TasksStore] 🗑️ Task deleted via socket:', data.taskId)
          if (tasksByBoard[boardId]) {
            tasksByBoard[boardId] = tasksByBoard[boardId].filter(task => task.id !== data.taskId)
          }
        })

        socketStore.emit('subscribe:board', { boardId })

        isSubscribed.value = true
        console.log(`[TasksStore] ✅ Subscribed to board ${boardId}`)
      } else if (attempts < 50) {
        console.log(`[TasksStore] ⏳ Waiting for socket connection... (attempt ${attempts + 1}/50)`)
        setTimeout(() => waitForSocket(attempts + 1), 100)
      } else {
        console.error(`[TasksStore] ❌ Failed to subscribe to board ${boardId}: socket not connected after 5 seconds`)
      }
    }

    waitForSocket()
  }

  const unsubscribeFromBoard = (boardId: number) => {
    console.log(`[TasksStore] 📴 Unsubscribing from board ${boardId}`)

    if (socketStore.socket?.connected) {
      socketStore.emit('unsubscribe:board', { boardId })
    }

    socketStore.off(`board:${boardId}:task:created`)
    socketStore.off(`board:${boardId}:task:updated`)
    socketStore.off(`board:${boardId}:tasks:updated`)
    socketStore.off(`board:${boardId}:task:deleted`)

    isSubscribed.value = false
  }

  // ============================================
  // ✅ ОПТИМИСТИЧНЫЕ МЕТОДЫ
  // ============================================

  async function updateTaskOptimistic(id: number, updates: Partial<UpdateTaskData>) {
    const boardId = currentBoardId.value
    if (!boardId || !tasksByBoard[boardId]) return
    const taskIndex = tasksByBoard[boardId].findIndex(t => t.id === id)
    if (taskIndex === -1) return

    const oldTask = { ...tasksByBoard[boardId][taskIndex] }
    const existingSubtasks = oldTask.subtasks // ✅ Сохраняем подзадачи

    try {
      // ✅ Обновляем задачу с сохранением подзадач
      tasksByBoard[boardId][taskIndex] = {
        ...oldTask,
        ...updates,
        subtasks: existingSubtasks // ✅ Восстанавливаем подзадачи
      } as Task

      const response = await $fetch<{ success: boolean, task: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: updates
      })

      if (response.task) {
        // ✅ При получении ответа от сервера тоже сохраняем подзадачи
        tasksByBoard[boardId][taskIndex] = {
          ...response.task,
          subtasks: response.task.subtasks || existingSubtasks || []
        }
      }
      return response.task
    } catch (error) {
      console.error('Failed to update task, rolling back:', error)
      if (tasksByBoard[boardId]) {
        tasksByBoard[boardId][taskIndex] = oldTask // Откатываем с подзадачами
      }
      throw error
    }
  }

  async function updateTasksOrderOptimistic(boardId: number, tasks: Task[]) {
    const oldTasks = [...(tasksByBoard[boardId] || [])]

    try {
      // ✅ СОХРАНЯЕМ ПОДЗАДАЧИ ПРИ ОБНОВЛЕНИИ ПОРЯДКА
      const tasksWithSubtasks = tasks.map(task => {
        const oldTask = oldTasks.find(t => t.id === task.id)
        return {
          ...task,
          subtasks: task.subtasks || oldTask?.subtasks || []
        }
      })

      tasksByBoard[boardId] = tasksWithSubtasks as Task[]

      const updates = tasks.map((task, index) => ({
        id: task.id,
        order: index
      }))

      await $fetch<{ success: boolean }>(`/api/boards/${boardId}/tasks/order`, {
        method: 'PUT',
        body: { updates }
      })

      return true
    } catch (error) {
      console.error('Failed to update tasks order, rolling back:', error)
      tasksByBoard[boardId] = oldTasks // Откатываем с подзадачами
      throw error
    }
  }

  // ============ ACTIONS ============
  async function fetchTasks(boardId: number) {
    loading.value = true
    error.value = null
    currentBoardId.value = boardId

    try {
      const response = await $fetch<{ tasks: Task[], total: number }>(`/api/boards/${boardId}/tasks`, {
        method: 'GET'
      })

      tasksByBoard[boardId] = response.tasks || []

      subscribeToBoard(boardId)
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке задач'
      console.error('❌ Failed to fetch tasks:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ✅ ГИБРИДНЫЙ ПОДХОД: ЛОКАЛЬНОЕ ДОБАВЛЕНИЕ + СОКЕТ СИНХРОНИЗАЦИЯ
  async function createTask(boardId: number, data: CreateTaskData) {
    loading.value = true
    error.value = null

    try {
      console.log('[TasksStore] 📤 Creating task on server...')

      const response = await $fetch<{ success: boolean, task: Task }>(`/api/boards/${boardId}/tasks`, {
        method: 'POST',
        body: data
      })

      console.log('[TasksStore] ✅ Task created on server:', response.task.id)

      // ✅ ДОБАВЛЯЕМ ЛОКАЛЬНО СРАЗУ (ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ)
      if (!tasksByBoard[boardId]) {
        tasksByBoard[boardId] = []
      }

      // Проверяем, нет ли уже такой задачи (на случай быстрого сокета)
      const exists = tasksByBoard[boardId].find(t => t.id === response.task.id)
      if (!exists) {
        console.log('[TasksStore] ➕ Adding task locally (optimistic)')
        tasksByBoard[boardId] = [response.task, ...tasksByBoard[boardId]]
      } else {
        console.log('[TasksStore] ⚠️ Task already added via socket')
      }

      // Сокет-событие придёт и обновит/синхронизирует данные для других пользователей
      // Обработчик task:created проверит дубликаты и обновит задачу если нужно

      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при создании задачи'
      console.error('Failed to create task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateTask(id: number, data: UpdateTaskData) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, task: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: data
      })

      // ✅ НЕ ОБНОВЛЯЕМ ЛОКАЛЬНО - сокет сам обновит

      return response.task
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении задачи'
      console.error('Failed to update task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteTask(id: number) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, message: string, boardId: number }>(`/api/tasks/${id}`, {
        method: 'DELETE'
      })

      // ✅ НЕ УДАЛЯЕМ ЛОКАЛЬНО - сокет сам обновит

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

  function clearState() {
    for (const boardId in tasksByBoard) {
      delete tasksByBoard[boardId]
    }

    if (isSubscribed.value && currentBoardId.value) {
      unsubscribeFromBoard(currentBoardId.value)
    }

    currentBoardId.value = null
    selectedTaskId.value = null
    error.value = null
    isSubscribed.value = false
  }

  // ============ GETTERS ============
  const tasks = computed(() => {
    return currentBoardId.value
      ? tasksByBoard[currentBoardId.value] || []
      : []
  })

  const allTasks = computed(() => tasks.value)

  const selectedTask = computed(() => {
    if (!selectedTaskId.value) return null
    return tasks.value.find(task => task.id === selectedTaskId.value)
  })

  const tasksByStatus = computed(() => {
    const statuses = ['todo', 'in_progress', 'review', 'done', 'blocked', 'cancelled'] as const
    const result: Record<(typeof statuses)[number], Task[]> = {
      todo: [],
      in_progress: [],
      review: [],
      done: [],
      blocked: [],
      cancelled: []
    }

    statuses.forEach(status => {
      result[status] = tasks.value.filter(task => task.status === status)
    })

    return result
  })

  function selectTask(id: number | null) {
    selectedTaskId.value = id
  }

  return {
    tasks,
    loading,
    error,
    selectedTaskId,
    currentBoardId,
    tasksByBoard,
    allTasks,
    selectedTask,
    tasksByStatus,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    clearState,
    updateTaskOptimistic,
    updateTasksOrderOptimistic,
    subscribeToBoard,
    unsubscribeFromBoard,
    selectTask
  }
})
