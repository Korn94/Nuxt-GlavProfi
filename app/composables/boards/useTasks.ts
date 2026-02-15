// app/composables/boards/useTasks.ts
import { computed } from 'vue'
import { useTasksStore } from '../../../stores/boards/tasks'
import { useSubtasksStore } from '../../../stores/boards/subtasks'
import { useTagsStore } from '../../../stores/boards/tags'

export function useTasks() {
  const tasksStore = useTasksStore()
  const subtasksStore = useSubtasksStore()
  const tagsStore = useTagsStore()

  // Получить все задачи доски
  const fetchTasks = async (boardId: number) => {
    try {
      await tasksStore.fetchTasks(boardId)
      return tasksStore.allTasks
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  }

  // Получить задачу по ID
  const fetchTask = async (id: number) => {
    try {
      const task = await tasksStore.fetchTaskById(id)
      // Загружаем подзадачи задачи
      if (task) {
        await subtasksStore.fetchSubtasks(id)
      }
      return task
    } catch (error) {
      console.error('Error fetching task:', error)
      throw error
    }
  }

  // Создать новую задачу
  const createTask = async (
    boardId: number,
    data: {
      title: string
      description?: string
      status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      assignedTo?: number | null
      dueDate?: string | null
      order?: number
      tags?: number[]
    }
  ) => {
    try {
      const task = await tasksStore.createTask(boardId, data)
      // Если есть теги, добавляем их
      if (data.tags && data.tags.length > 0) {
        await tagsStore.addTagsToTask(task.id, data.tags)
      }
      return task
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  // Обновить задачу
  const updateTask = async (
    id: number,
    data: {
      title?: string
      description?: string
      status?: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled'
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      assignedTo?: number | null
      dueDate?: string | null
      order?: number
      tags?: number[]
    }
  ) => {
    try {
      const task = await tasksStore.updateTask(id, data)
      // Если есть теги, обновляем их
      if (data.tags !== undefined) {
        // Сначала получаем текущие теги задачи
        const currentTags = await tagsStore.fetchTaskTags(id)
        // Удаляем старые теги, которых нет в новых
        const tagsToRemove = currentTags.filter(
          tag => !data.tags?.includes(tag.id)
        )
        for (const tag of tagsToRemove) {
          await tagsStore.removeTagFromTask(id, tag.id)
        }
        // Добавляем новые теги
        if (data.tags && data.tags.length > 0) {
          await tagsStore.addTagsToTask(id, data.tags)
        }
      }
      return task
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  // Удалить задачу
  const deleteTask = async (id: number) => {
    try {
      await tasksStore.deleteTask(id)
      // Очищаем подзадачи
      subtasksStore.clearState()
      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  // Выбрать задачу
  const selectTask = (id: number | null) => {
    tasksStore.selectTask(id)
  }

  // Очистить состояние
  const clearTasks = () => {
    tasksStore.clearState()
    subtasksStore.clearState()
  }

  // Получить задачи по статусу
  const getTasksByStatus = (status: string) => {
    return tasksStore.tasksByStatus[status as keyof typeof tasksStore.tasksByStatus] || []
  }

  // Получить задачи по приоритету
  const getTasksByPriority = (priority: string) => {
    return tasksStore.tasksByPriority[priority as keyof typeof tasksStore.tasksByPriority] || []
  }

  return {
    // State (реактивные через computed)
    tasks: computed(() => tasksStore.allTasks),
    selectedTask: computed(() => tasksStore.selectedTask),
    tasksByStatus: computed(() => tasksStore.tasksByStatus),
    tasksByPriority: computed(() => tasksStore.tasksByPriority),
    tasksStats: computed(() => tasksStore.tasksStats),
    loading: computed(() => tasksStore.loading),
    error: computed(() => tasksStore.error),
    // Actions
    fetchTasks,
    fetchTask,
    createTask,
    updateTask,
    deleteTask,
    selectTask,
    clearTasks,
    getTasksByStatus,
    getTasksByPriority
  }
}
