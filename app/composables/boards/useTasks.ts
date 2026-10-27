// app/composables/boards/useTasks.ts
/**
 * Composable для работы с задачами
 * 
 * Архитектура:
 * - API запросы через $fetch
 * - Real-time обновления приходят от сервера (socket broadcast из REST API)
 *   ❌ P2: ручные socketService.emit(...) удалены — дублировали серверный broadcast
 * - Интеграция с tasksStore, subtasksStore, tagsStore
 * - Оптимистичные обновления UI
 */

import { computed } from 'vue'
import { useTasksStore } from '../../../stores/boards/tasks'
import { useSubtasksStore } from '../../../stores/boards/subtasks'
import { useTagsStore } from '../../../stores/boards/tags'

export function useTasks() {
  const tasksStore = useTasksStore()
  const subtasksStore = useSubtasksStore()
  const tagsStore = useTagsStore()

  // ============================================
  // FETCH TASKS
  // ============================================
  
  /**
   * Получить все задачи доски
   * @param boardId - ID доски
   */
  const fetchTasks = async (boardId: number) => {
    try {
      await tasksStore.fetchTasks(boardId)
      return tasksStore.allTasks
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }
  }

  /**
   * Получить задачу по ID
   * @param id - ID задачи
   */
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

  // ============================================
  // CREATE TASK
  // ============================================
  
  /**
   * Создать новую задачу
   * @param boardId - ID доски
   * @param data - Данные задачи
   */
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
      // ✅ 1. Создаём задачу через API
      const task = await tasksStore.createTask(boardId, data)
      
      // ✅ 2. Добавляем теги если есть
      if (data.tags && data.tags.length > 0) {
        await tagsStore.addTagsToTask(task.id, data.tags)
      }
      
      // ✅ 3. Broadcast в комнату доски выполняет сервер (REST API):
      // server/api/boards/[id]/tasks/index.post.ts → broadcastTaskCreated()
      // Ручной emit удалён (P2) — он дублировал серверный broadcast.

      return task
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  // ============================================
  // UPDATE TASK
  // ============================================
  
  /**
   * Обновить задачу
   * @param id - ID задачи
   * @param data - Данные для обновления
   */
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
      // ✅ 1. Обновляем задачу через API
      const task = await tasksStore.updateTask(id, data)
      
      // ✅ 2. Обновляем теги если переданы
      if (data.tags !== undefined) {
        const currentTags = await tagsStore.fetchTaskTags(id)
        const tagsToRemove = currentTags.filter(
          tag => !data.tags?.includes(tag.id)
        )
        for (const tag of tagsToRemove) {
          await tagsStore.removeTagFromTask(id, tag.id)
        }
        if (data.tags && data.tags.length > 0) {
          await tagsStore.addTagsToTask(id, data.tags)
        }
      }
      
      // ✅ 3. Broadcast в комнату доски выполняет сервер (REST API):
      // server/api/boards/tasks/[id]/index.put.ts → broadcastTaskUpdated()
      // Ручной emit удалён (P2) — он дублировал серверный broadcast.

      return task
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  // ============================================
  // DELETE TASK
  // ============================================
  
  /**
   * Удалить задачу
   * @param id - ID задачи
   */
  const deleteTask = async (id: number) => {
    try {
      // ✅ 1. Удаляем задачу через API
      await tasksStore.deleteTask(id)
      
      // ✅ 2. Очищаем подзадачи
      subtasksStore.clearState()
      
      // ✅ 3. Broadcast в комнату доски выполняет сервер (REST API):
      // server/api/boards/tasks/[id]/index.delete.ts → broadcastTaskDeleted()
      // Ручной emit удалён (P2) — он дублировал серверный broadcast.
      
      return true
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  // ============================================
  // REORDER TASKS
  // ============================================
  
  /**
   * Обновить порядок задач в колонке
   *
   * ⚠️ P2: персист порядка делает серверный API
   * (PUT /api/boards/:id/tasks/order), ручной socket-emit удалён.
   *
   * @param boardId - ID доски
   * @param status - Статус колонки
   * @param tasks - Массив задач с новыми order
   */
  const updateTasksOrder = async (
    boardId: number,
    status: string,
    tasks: Array<{ id: number; order: number }>
  ) => {
    try {
      // ✅ 1. Оптимистичное обновление в store
      await tasksStore.updateTasksOrderOptimistic(boardId, tasks.map(t => ({
        id: t.id,
        order: t.order,
        status: status as any
      } as any)))
      
      // ✅ 2. Broadcast выполняет сервер (REST API):
      // PUT /api/boards/:id/tasks/order (Kanban/Column) + server-side emit
      // Ручной emit удалён (P2) — он дублировал серверный broadcast.
      
      return true
    } catch (error) {
      console.error('Error updating tasks order:', error)
      throw error
    }
  }

  // ============================================
  // UTILS
  // ============================================
  
  /**
   * Выбрать задачу
   * @param id - ID задачи или null
   */
  const selectTask = (id: number | null) => {
    tasksStore.selectTask(id)
  }

  /**
   * Очистить состояние
   */
  const clearTasks = () => {
    tasksStore.clearState()
    subtasksStore.clearState()
  }

  /**
   * Получить задачи по статусу
   * @param status - Статус задачи
   */
  const getTasksByStatus = (status: string) => {
    return tasksStore.tasksByStatus[status as keyof typeof tasksStore.tasksByStatus] || []
  }

  /**
   * Получить задачи по приоритету
   * @param priority - Приоритет задачи
   */
  const getTasksByPriority = (priority: string) => {
    return tasksStore.tasksByPriority[priority as keyof typeof tasksStore.tasksByPriority] || []
  }

  // ============================================
  // RETURN
  // ============================================
  
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
    updateTasksOrder, // ✅ Новый метод для обновления порядка
    selectTask,
    clearTasks,
    getTasksByStatus,
    getTasksByPriority
  }
}
