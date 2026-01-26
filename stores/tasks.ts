// stores/tasks.ts
import { defineStore } from 'pinia'
import type { Ref } from 'vue'

// === 1. ОПРЕДЕЛЯЕМ ТИПЫ ===
export interface Task {
  id: number
  objectId: number
  title: string
  description?: string
  parentId?: number | null
  dueDate?: string | null
  completed: boolean
  priority: number
  assignedTo?: number | null
  createdAt: string
  updatedAt: string
}

interface WebSocketUpdate {
  type: 'task-updated'
  task: Task
}

// === 2. СОЗДАЕМ СТОР ===
export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [] as Task[],
    isLoading: false
  }),
  actions: {
    async loadTasks(objectId: number) {
      this.isLoading = true
      this.tasks = await $fetch<Task[]>(`/api/tasks?object_id=${objectId}`)
      this.isLoading = false
    },
    
    // === 3. ИСПРАВЛЯЕМ ТИПЫ ===
    handleWebSocketUpdate(data: WebSocketUpdate) {
      const index = this.tasks.findIndex((t: Task) => t.id === data.task.id)
      if (index !== -1) {
        this.tasks[index] = data.task
      } else {
        this.tasks.push(data.task)
      }
    }
  }
})
