// app/composables/boards/useSubtasks.ts
import { useSubtasksStore } from '../../../stores/boards/subtasks'

export function useSubtasks() {
  const subtasksStore = useSubtasksStore()

  // Получить все подзадачи задачи
  const fetchSubtasks = async (taskId: number) => {
    try {
      await subtasksStore.fetchSubtasks(taskId)
      return subtasksStore.allSubtasks
    } catch (error) {
      console.error('Error fetching subtasks:', error)
      throw error
    }
  }

  // Создать новую подзадачу
  const createSubtask = async (
    taskId: number,
    data: {
      title: string
      description?: string
      parentId?: number | null
      order?: number
    }
  ) => {
    try {
      const subtask = await subtasksStore.createSubtask(taskId, data)
      return subtask
    } catch (error) {
      console.error('Error creating subtask:', error)
      throw error
    }
  }

  // Обновить подзадачу
  const updateSubtask = async (
    id: number,
    data: {
      title?: string
      description?: string
      parentId?: number | null
      order?: number
    }
  ) => {
    try {
      const subtask = await subtasksStore.updateSubtask(id, data)
      return subtask
    } catch (error) {
      console.error('Error updating subtask:', error)
      throw error
    }
  }

  // Завершить/развернуть подзадачу
  const completeSubtask = async (
    id: number,
    isCompleted?: boolean,
    updateChildren: boolean = false
  ) => {
    try {
      const subtask = await subtasksStore.completeSubtask(id, isCompleted, updateChildren)
      return subtask
    } catch (error) {
      console.error('Error completing subtask:', error)
      throw error
    }
  }

  // Удалить подзадачу
  const deleteSubtask = async (id: number) => {
    try {
      await subtasksStore.deleteSubtask(id)
      return true
    } catch (error) {
      console.error('Error deleting subtask:', error)
      throw error
    }
  }

  // Получить подзадачи по задаче
  const getSubtasksByTaskId = (taskId: number) => {
    return subtasksStore.getSubtasksByTaskId(taskId)
  }

  // Получить корневые подзадачи (без родителя)
  const getRootSubtasks = (taskId: number) => {
    return subtasksStore.getRootSubtasks(taskId)
  }

  // Получить все дочерние подзадачи
  const getAllChildSubtasks = (parentId: number) => {
    return subtasksStore.getAllChildSubtasks(parentId)
  }

  // Очистить состояние
  const clearSubtasks = () => {
    subtasksStore.clearState()
  }

  return {
    // State
    subtasks: subtasksStore.allSubtasks,
    subtasksStats: subtasksStore.subtasksStats,
    loading: subtasksStore.loading,
    error: subtasksStore.error,

    // Actions
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    completeSubtask,
    deleteSubtask,
    getSubtasksByTaskId,
    getRootSubtasks,
    getAllChildSubtasks,
    clearSubtasks
  }
}
