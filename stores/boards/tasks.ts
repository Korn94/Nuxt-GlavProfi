// stores/boards/tasks.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Task, CreateTaskData, UpdateTaskData } from '~/types/boards'

export const useTasksStore = defineStore('tasks', () => {
  // ============ STATE ============
  
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedTaskId = ref<number | null>(null)

  // ============ GETTERS ============
  
  // Все задачи
  const allTasks = computed(() => tasks.value)

  // Выбранная задача
  const selectedTask = computed(() => {
    if (!selectedTaskId.value) return null
    return tasks.value.find(task => task.id === selectedTaskId.value)
  })

  // Задачи по статусу
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

  // Задачи по приоритету
  const tasksByPriority = computed(() => {
    const priorities = ['urgent', 'high', 'medium', 'low'] as const
    const result: Record<(typeof priorities)[number], Task[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: []
    }
    
    priorities.forEach(priority => {
      result[priority] = tasks.value.filter(task => task.priority === priority)
    })
    
    return result
  })

  // Статистика по задачам
  const tasksStats = computed(() => {
    return {
      total: tasks.value.length,
      todo: tasksByStatus.value.todo.length,
      inProgress: tasksByStatus.value.in_progress.length,
      review: tasksByStatus.value.review.length,
      done: tasksByStatus.value.done.length,
      blocked: tasksByStatus.value.blocked.length,
      cancelled: tasksByStatus.value.cancelled.length
    }
  })

  // ============ ACTIONS ============
  
  // Получить все задачи доски
  async function fetchTasks(boardId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ tasks: Task[], total: number }>(`/api/boards/${boardId}/tasks`, {
        method: 'GET'
      })

      tasks.value = response.tasks || []
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
      const response = await $fetch<{ task: Task }>(`/api/tasks/${id}`, {
        method: 'GET'
      })

      // Обновляем задачу в списке или добавляем новую
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1) {
        tasks.value[index] = response.task
      } else {
        tasks.value.push(response.task)
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

  // Создать новую задачу
  async function createTask(boardId: number, data: CreateTaskData) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, task: Task }>(`/api/boards/${boardId}/tasks`, {
        method: 'POST',
        body: data
      })

      // Добавляем новую задачу в начало списка
      if (response.task) {
        tasks.value.unshift(response.task)
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

  // Обновить задачу
  async function updateTask(id: number, data: UpdateTaskData) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, task: Task }>(`/api/tasks/${id}`, {
        method: 'PUT',
        body: data
      })

      // Обновляем задачу в списке
      const index = tasks.value.findIndex(task => task.id === id)
      if (index !== -1 && response.task) {
        tasks.value[index] = response.task
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
      await $fetch<{ success: boolean, message: string }>(`/api/tasks/${id}`, {
        method: 'DELETE'
      })

      // Удаляем задачу из списка
      tasks.value = tasks.value.filter(task => task.id !== id)

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
    selectedTaskId.value = null
    error.value = null
  }

  // ============ ВОЗВРАТ ============
  
  return {
    // State
    tasks,
    loading,
    error,
    selectedTaskId,

    // Getters
    allTasks,
    selectedTask,
    tasksByStatus,
    tasksByPriority,
    tasksStats,

    // Actions
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    selectTask,
    clearState
  }
})
