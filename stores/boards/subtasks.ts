// stores/boards/subtasks.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Subtask } from '~/types/boards'

export const useSubtasksStore = defineStore('subtasks', () => {
  // ============ STATE ============
  
  const subtasks = ref<Subtask[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============ GETTERS ============
  
  // Все подзадачи
  const allSubtasks = computed(() => subtasks.value)

  // Подзадачи по задаче
  function getSubtasksByTaskId(taskId: number) {
    return computed(() => {
      return subtasks.value.filter(subtask => subtask.taskId === taskId)
    })
  }

  // Подзадачи первого уровня (без родителя)
  function getRootSubtasks(taskId: number) {
    return computed(() => {
      return subtasks.value.filter(
        subtask => subtask.taskId === taskId && subtask.parentId === null
      )
    })
  }

  // Рекурсивное получение всех дочерних подзадач
  function getAllChildSubtasks(parentId: number) {
    const children: Subtask[] = []
    
    function findChildren(id: number) {
      const directChildren = subtasks.value.filter(subtask => subtask.parentId === id)
      children.push(...directChildren)
      directChildren.forEach(child => findChildren(child.id))
    }
    
    findChildren(parentId)
    return children
  }

  // Статистика по подзадачам
  const subtasksStats = computed(() => {
    const completed = subtasks.value.filter(s => s.isCompleted).length
    return {
      total: subtasks.value.length,
      completed,
      inProgress: subtasks.value.length - completed
    }
  })

  // ============ ACTIONS ============
  
  // Получить все подзадачи задачи
  async function fetchSubtasks(taskId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ subtasks: Subtask[], total: number }>(
        `/api/tasks/${taskId}/subtasks`,
        {
          method: 'GET'
        }
      )

      // Обновляем подзадачи в списке
      subtasks.value = response.subtasks || []
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке подзадач'
      console.error('Failed to fetch subtasks:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Создать новую подзадачу
  async function createSubtask(taskId: number, data: {
    title: string
    description?: string
    parentId?: number | null
    order?: number
  }) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, subtask: Subtask }>(
        `/api/tasks/${taskId}/subtasks`,
        {
          method: 'POST',
          body: data
        }
      )

      // Добавляем новую подзадачу в список
      if (response.subtask) {
        subtasks.value.push(response.subtask)
      }

      return response.subtask
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при создании подзадачи'
      console.error('Failed to create subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Обновить подзадачу
  async function updateSubtask(id: number, data: {
    title?: string
    description?: string
    parentId?: number | null
    order?: number
  }) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, subtask: Subtask }>(
        `/api/subtasks/${id}`,
        {
          method: 'PUT',
          body: data
        }
      )

      // Обновляем подзадачу в списке
      const index = subtasks.value.findIndex(subtask => subtask.id === id)
      if (index !== -1 && response.subtask) {
        subtasks.value[index] = response.subtask
      }

      return response.subtask
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении подзадачи'
      console.error('Failed to update subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Завершить/развернуть подзадачу
  async function completeSubtask(id: number, isCompleted?: boolean, updateChildren?: boolean) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, subtask: Subtask }>(
        `/api/subtasks/${id}/complete`,
        {
          method: 'PUT',
          body: {
            isCompleted,
            updateChildren
          }
        }
      )

      // Обновляем подзадачу в списке
      const index = subtasks.value.findIndex(subtask => subtask.id === id)
      if (index !== -1 && response.subtask) {
        subtasks.value[index] = response.subtask
      }

      return response.subtask
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при изменении статуса подзадачи'
      console.error('Failed to complete subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Удалить подзадачу
  async function deleteSubtask(id: number) {
    loading.value = true
    error.value = null

    try {
      await $fetch<{ success: boolean, message: string }>(`/api/subtasks/${id}`, {
        method: 'DELETE'
      })

      // Удаляем подзадачу из списка (и все её дочерние подзадачи)
      const childrenIds = getAllChildSubtasks(id).map(s => s.id)
      subtasks.value = subtasks.value.filter(
        subtask => subtask.id !== id && !childrenIds.includes(subtask.id)
      )

      return true
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при удалении подзадачи'
      console.error('Failed to delete subtask:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Очистить состояние
  function clearState() {
    subtasks.value = []
    error.value = null
  }

  // ============ ВОЗВРАТ ============
  
  return {
    // State
    subtasks,
    loading,
    error,

    // Getters
    allSubtasks,
    getSubtasksByTaskId,
    getRootSubtasks,
    getAllChildSubtasks,
    subtasksStats,

    // Actions
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    completeSubtask,
    deleteSubtask,
    clearState
  }
})
