// app/composables/boards/useSubtasks.ts

import { useSubtasksStore } from '../../../stores/boards/subtasks'
import { useSocketStore } from '../../../stores/socket'
import { useTasksStore } from '../../../stores/boards/tasks' // Импортируем TasksStore
import type { Subtask } from '~/types/boards'

export function useSubtasks() {
  const subtasksStore = useSubtasksStore()
  const socketStore = useSocketStore()
  const tasksStore = useTasksStore() // Получаем экземпляр TasksStore

  // --- FETCH ---
  async function fetchSubtasks(taskId: number) {
    try {
      const response = await $fetch<{ subtasks: Subtask[], total: number }>(
        `/api/boards/tasks/${taskId}/subtasks`,
        { method: 'GET' }
      )
      subtasksStore.subtasks = response.subtasks || []
      subtasksStore.subscribeToTask(taskId) // ✅ Подписываемся после загрузки
      return subtasksStore.subtasks
    } catch (err: any) {
      subtasksStore.error = err.data?.message || 'Ошибка при загрузке подзадач'
      console.error('Failed to fetch subtasks:', err)
      throw err
    }
  }

  // --- CREATE ---
  async function createSubtask(taskId: number, data: { title: string; description?: string | null; parentId?: number | null; order?: number }) {
    subtasksStore.loading = true
    subtasksStore.error = null
    try {
      const response = await $fetch<{ success: boolean, subtask: Subtask }>(
        `/api/boards/tasks/${taskId}/subtasks`,
        { method: 'POST', body: data }
      )

      if (response.subtask) {
        const exists = subtasksStore.subtasks.find((s: Subtask) => s.id === response.subtask!.id) // <- Явно указываем тип параметра s
        if (!exists) {
          subtasksStore.subtasks.push(response.subtask!)
        }
      }

      // ✅ ОБНОВЛЯЕМ ПОДЗАДАЧИ В TASKSTORE ИЗ СОСТОЯНИЯ SUBTASKSSTORE
      tasksStore.updateTaskSubtasksFromStore(taskId)

      return response.subtask
    } catch (err: any) {
      subtasksStore.error = err.data?.message || 'Ошибка при создании подзадачи'
      console.error('Failed to create subtask:', err)
      throw err
    } finally {
      subtasksStore.loading = false
    }
  }

  // --- UPDATE ---
  async function updateSubtask(id: number, data: { title?: string; description?: string | null; parentId?: number | null; order?: number }) {
    subtasksStore.loading = true
    subtasksStore.error = null
    try {
      const response = await $fetch<{ success: boolean, subtask: Subtask }>(
        `/api/boards/subtasks/${id}`,
        { method: 'PUT', body: data }
      )
      const index = subtasksStore.subtasks.findIndex((s: Subtask) => s.id === id) // <- Явно указываем тип параметра s
      if (index !== -1 && response.subtask) {
        // Сохраняем текущие дочерние подзадачи, если они есть в обновлении
        const currentChildren = subtasksStore.subtasks[index].subtasks;
        subtasksStore.subtasks[index] = {
          ...response.subtask,
          // Важно: восстанавливать вложенные подзадачи из текущего состояния, если сервер не отправил полное дерево
          subtasks: response.subtask.subtasks || currentChildren || []
        };
      }

      // ✅ ОБНОВЛЯЕМ ПОДЗАДАЧИ В TASKSTORE ИЗ СОСТОЯНИЯ SUBTASKSSTORE
      // Нужно получить taskId из обновлённой подзадачи или из текущего состояния
      const updatedTaskId = response.subtask?.taskId;
      if (updatedTaskId) {
        tasksStore.updateTaskSubtasksFromStore(updatedTaskId);
      }

      return response.subtask
    } catch (err: any) {
      subtasksStore.error = err.data?.message || 'Ошибка при обновлении подзадачи'
      console.error('Failed to update subtask:', err)
      throw err
    } finally {
      subtasksStore.loading = false
    }
  }

  // --- COMPLETE ---
  async function completeSubtask(id: number, isCompleted?: boolean, updateChildren: boolean = false) {
    subtasksStore.loading = true
    subtasksStore.error = null
    try {
      const response = await $fetch<{ success: boolean, subtask: Subtask }>(
        `/api/boards/subtasks/${id}/complete`,
        { method: 'PUT', body: { isCompleted, updateChildren } }
      )
      const index = subtasksStore.subtasks.findIndex((s: Subtask) => s.id === id) // <- Явно указываем тип параметра s
      if (index !== -1 && response.subtask) {
        // Сохраняем текущие дочерние подзадачи, если они есть в обновлении
        const currentChildren = subtasksStore.subtasks[index].subtasks;
        subtasksStore.subtasks[index] = {
          ...response.subtask,
          subtasks: response.subtask.subtasks || currentChildren || []
        };
      }

      // ✅ ОБНОВЛЯЕМ ПОДЗАДАЧИ В TASKSTORE ИЗ СОСТОЯНИЯ SUBTASKSSTORE
      const updatedTaskId = response.subtask?.taskId;
      if (updatedTaskId) {
        tasksStore.updateTaskSubtasksFromStore(updatedTaskId);
      }

      return response.subtask
    } catch (err: any) {
      subtasksStore.error = err.data?.message || 'Ошибка при изменении статуса'
      console.error('Failed to complete subtask:', err)
      throw err
    } finally {
      subtasksStore.loading = false
    }
  }

  // --- DELETE ---
  async function deleteSubtask(id: number) {
    subtasksStore.loading = true
    subtasksStore.error = null
    try {
      await $fetch<{ success: boolean, message: string }>(
        `/api/boards/subtasks/${id}`,
        { method: 'DELETE' }
      )

      // Удаляем подзадачу и все её дочерние элементы
      const getAllChildrenIds = (parentId: number): number[] => {
        const children = subtasksStore.subtasks.filter((s: Subtask) => s.parentId === parentId) // <- Явно указываем тип параметра s
        return children.reduce((ids: number[], child: Subtask) => { // <- Явно указываем типы параметров reduce
          return [...ids, child.id, ...getAllChildrenIds(child.id)]
        }, [parentId] as number[]) // Включаем саму подзадачу для удаления
      }
      const idsToDelete = getAllChildrenIds(id)
      subtasksStore.subtasks = subtasksStore.subtasks.filter(
        (s: Subtask) => !idsToDelete.includes(s.id) // <- Явно указываем тип параметра s
      )

      // ✅ ОБНОВЛЯЕМ ПОДЗАДАЧИ В TASKSTORE ИЗ СОСТОЯНИЯ SUBTASKSSTORE
      // Нужно получить taskId из подзадачи, которую собираемся удалить
      const subtaskToDelete = subtasksStore.subtasks.find((s: Subtask) => s.id === id); // <- Явно указываем тип параметра s
      if (subtaskToDelete) {
        tasksStore.updateTaskSubtasksFromStore(subtaskToDelete.taskId);
      }

      return true
    } catch (err: any) {
      subtasksStore.error = err.data?.message || 'Ошибка при удалении подзадачи'
      console.error('Failed to delete subtask:', err)
      throw err
    } finally {
      subtasksStore.loading = false
    }
  }

  // --- UTILS ---
  const getSubtasksByTaskId = (taskId: number) => {
    return subtasksStore.getSubtasksByTaskId(taskId)
  }

  const getRootSubtasks = (taskId: number) => {
    return subtasksStore.getRootSubtasks(taskId)
  }

  const getAllChildSubtasks = (parentId: number) => {
    return subtasksStore.getAllChildSubtasks(parentId)
  }

  const clearSubtasks = () => {
    subtasksStore.clearState()
  }

  // --- SOCKET ---
  const subscribeToTask = (taskId: number) => {
    subtasksStore.subscribeToTask(taskId)
  }

  const unsubscribeFromTask = (taskId: number) => {
    subtasksStore.unsubscribeFromTask(taskId)
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