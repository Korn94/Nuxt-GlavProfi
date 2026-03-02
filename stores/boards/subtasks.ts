// stores/boards/subtasks.ts

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useSocketStore } from '../socket'
import { useTasksStore } from './tasks'
import type { Subtask } from '~/types/boards'

// ===============================
// helpers
// ===============================
const buildSubtaskTree = (roots: Subtask[], all: Subtask[]): Subtask[] =>
  roots.map(root => ({
    ...root,
    subtasks: buildSubtaskTree(
      all.filter(s => s.parentId === root.id),
      all
    )
  }))

export const useSubtasksStore = defineStore('subtasks', () => {
  // ===============================
  // STATE
  // ===============================
  const subtasks = ref<Subtask[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const subscribedTaskIds = ref<Set<number>>(new Set())

  const socketStore = useSocketStore()
  const tasksStore = useTasksStore()

  // ===============================
  // GETTERS
  // ===============================
  const allSubtasks = computed(() => subtasks.value)

  const subtasksStats = computed(() => {
    const total = subtasks.value.length
    const completed = subtasks.value.filter(s => s.isCompleted).length
    return {
      total,
      completed,
      progress: total ? Math.round((completed / total) * 100) : 0
    }
  })

  // ===============================
  // SOCKET
  // ===============================
  const subscribeToTask = (taskId: number) => {
    if (subscribedTaskIds.value.has(taskId)) return

    // ⛔ socket ещё не готов — ждём
    if (!socketStore.connected) {
      console.warn(`[SubtasksStore] ⏳ Waiting socket before subscribe task ${taskId}`)

      const stop = watch(
        () => socketStore.connected,
        (connected) => {
          if (connected) {
            stop()
            subscribeToTask(taskId)
          }
        }
      )
      return
    }

    console.log(`[SubtasksStore] 🔔 Subscribing to task ${taskId}`)

    // ➕ CREATED
    socketStore.on(`task:${taskId}:subtask:created`, ({ subtask }: { subtask: Subtask }) => {
      if (!subtask) return

      if (!subtasks.value.some(s => s.id === subtask.id)) {
        subtasks.value.push(subtask)
      }

      tasksStore.updateTaskSubtasksFromStore(taskId)
    })

    // ✏️ UPDATED
    socketStore.on(`task:${taskId}:subtask:updated`, ({ subtask }: { subtask: Subtask }) => {
      if (!subtask) return

      const idx = subtasks.value.findIndex(s => s.id === subtask.id)
      if (idx !== -1) {
        const children = subtasks.value[idx].subtasks
        subtasks.value[idx] = { ...subtask, subtasks: children }
      } else {
        subtasks.value.push(subtask)
      }

      tasksStore.updateTaskSubtasksFromStore(taskId)
    })

    // 🗑️ DELETED
    socketStore.on(`task:${taskId}:subtask:deleted`, ({ subtaskId }: { subtaskId: number }) => {
      const collectIds = (id: number): number[] => {
        const children = subtasks.value.filter(s => s.parentId === id)
        return children.reduce<number[]>(
          (acc, c) => [...acc, c.id, ...collectIds(c.id)],
          [id]
        )
      }

      const ids = collectIds(subtaskId)
      subtasks.value = subtasks.value.filter(s => !ids.includes(s.id))

      tasksStore.updateTaskSubtasksFromStore(taskId)
    })

    socketStore.emit('join', `task:${taskId}`)
    subscribedTaskIds.value.add(taskId)

    console.log(`[SubtasksStore] ✅ Subscribed to task ${taskId}`)
  }

  const unsubscribeFromTask = (taskId: number) => {
    if (!subscribedTaskIds.value.has(taskId)) return

    socketStore.off(`task:${taskId}:subtask:created`)
    socketStore.off(`task:${taskId}:subtask:updated`)
    socketStore.off(`task:${taskId}:subtask:deleted`)

    subscribedTaskIds.value.delete(taskId)
    console.log(`[SubtasksStore] 📴 Unsubscribed from task ${taskId}`)
  }

  // ===============================
  // HTTP (initial load only)
  // ===============================
  async function fetchSubtasks(taskId: number) {
    loading.value = true
    try {
      const res = await $fetch<{ subtasks: Subtask[] }>(
        `/api/boards/tasks/${taskId}/subtasks`
      )

      subtasks.value = res.subtasks ?? []
      subscribeToTask(taskId)
    } finally {
      loading.value = false
    }
  }

  // ⛔ HTTP-методы больше НЕ мутируют store
  async function createSubtask(taskId: number, data: any) {
    return await $fetch(`/api/boards/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: data
    })
  }

  async function updateSubtask(id: number, data: any) {
    return await $fetch(`/api/boards/subtasks/${id}`, {
      method: 'PUT',
      body: data
    })
  }

  async function completeSubtask(id: number, isCompleted?: boolean, updateChildren?: boolean) {
    return await $fetch(`/api/boards/subtasks/${id}/complete`, {
      method: 'PUT',
      body: { isCompleted, updateChildren }
    })
  }

  async function deleteSubtask(id: number) {
    return await $fetch(`/api/boards/subtasks/${id}`, { method: 'DELETE' })
  }

  // ===============================
  // TREE
  // ===============================
  function getSubtasksByTaskId(taskId: number): Subtask[] {
    const roots = subtasks.value.filter(
      s => s.taskId === taskId && s.parentId === null
    )
    return buildSubtaskTree(roots, subtasks.value)
  }

  function cleanupSubscriptions() {
    subscribedTaskIds.value.forEach(unsubscribeFromTask)
    subscribedTaskIds.value.clear()
  }

  return {
    subtasks,
    loading,
    error,
    allSubtasks,
    subtasksStats,
    fetchSubtasks,
    createSubtask,
    updateSubtask,
    completeSubtask,
    deleteSubtask,
    getSubtasksByTaskId,
    subscribeToTask,
    unsubscribeFromTask,
    cleanupSubscriptions
  }
})
