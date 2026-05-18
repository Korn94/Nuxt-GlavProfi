// stores/boards/taskModal.ts
import { defineStore } from 'pinia'
import type { Task } from '~/types/boards'

export interface TaskModalState {
  isOpen: boolean
  taskId: number | null
  taskData: Task | null
}

export const useTaskModalStore = defineStore('taskModal', {
  state: (): TaskModalState => ({
    isOpen: false,
    taskId: null,
    taskData: null
  }),

  actions: {
    open(taskId: number, p1: null = null, p2: number | null = null, taskData?: Task) {
      this.isOpen = true
      this.taskId = taskId
      this.taskData = taskData || null
      document.body.style.overflow = 'hidden' // Блокируем скролл
    },

    close() {
      this.isOpen = false
      this.taskId = null
      this.taskData = null
      document.body.style.overflow = '' // Восстанавливаем скролл
    },

    setTaskData(task: Task) {
      this.taskData = task
    }
  }
})
