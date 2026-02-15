// app/composables/boards/useSubtasks.ts
import { useSubtasksStore } from '../../../stores/boards/subtasks'
import { useSocketStore } from '../../../stores/socket'

export function useSubtasks() {
  const subtasksStore = useSubtasksStore()
  const socketStore = useSocketStore()

  // ✅ ПОДПИСКА НА СОКЕТ-СОБЫТИЯ
  const subscribeToTask = (taskId: number) => {
    console.log(`[Subtasks] Subscribing to task ${taskId}`)
    
    socketStore.on(`task:${taskId}:subtask:created`, (data: { subtask: any }) => {
      console.log('[Subtasks] 🆕 Subtask created via socket:', data.subtask.id)
      subtasksStore.subtasks.push(data.subtask)
    })

    socketStore.on(`task:${taskId}:subtask:updated`, (data: { subtaskId: number; subtask: any }) => {
      console.log('[Subtasks] 🔄 Subtask updated via socket:', data.subtaskId)
      const index = subtasksStore.subtasks.findIndex(s => s.id === data.subtaskId)
      if (index !== -1) {
        subtasksStore.subtasks[index] = { ...data.subtask }
      }
    })

    socketStore.on(`task:${taskId}:subtask:deleted`, (data: { subtaskId: number }) => {
      console.log('[Subtasks] 🗑️ Subtask deleted via socket:', data.subtaskId)
      // Удаляем подзадачу и все её дочерние
      const getAllChildrenIds = (parentId: number): number[] => {
        const children = subtasksStore.subtasks.filter(s => s.parentId === parentId)
        return children.reduce((ids, child) => {
          return [...ids, child.id, ...getAllChildrenIds(child.id)]
        }, [] as number[])
      }
      const childrenIds = getAllChildrenIds(data.subtaskId)
      subtasksStore.subtasks = subtasksStore.subtasks.filter(
        s => s.id !== data.subtaskId && !childrenIds.includes(s.id)
      )
    })
  }

  // ✅ ОТПИСКА
  const unsubscribeFromTask = (taskId: number) => {
    console.log(`[Subtasks] Unsubscribing from task ${taskId}`)
    socketStore.off(`task:${taskId}:subtask:created`)
    socketStore.off(`task:${taskId}:subtask:updated`)
    socketStore.off(`task:${taskId}:subtask:deleted`)
  }

  // ✅ Получить все подзадачи задачи (с подпиской на сокеты)
  const fetchSubtasks = async (taskId: number) => {
    try {
      await subtasksStore.fetchSubtasks(taskId)
      subscribeToTask(taskId) // ← Подписываемся после загрузки
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
    clearSubtasks,
    // ✅ СОКЕТЫ
    subscribeToTask,
    unsubscribeFromTask
  }
}
