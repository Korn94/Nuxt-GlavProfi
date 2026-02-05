// stores/boards/index.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Board, CreateBoardData, UpdateBoardData } from '~/types/boards'

export const useBoardsStore = defineStore('boards', () => {
  // ============ STATE ============
  
  const boards = ref<Board[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedBoardId = ref<number | null>(null)

  // ============ GETTERS ============
  
  // Все доски
  const allBoards = computed(() => boards.value)

  // Выбранная доска
  const selectedBoard = computed(() => {
    if (!selectedBoardId.value) return null
    return boards.value.find(board => board.id === selectedBoardId.value)
  })

  // Доски типа 'object' (привязанные к объектам)
  const objectBoards = computed(() => {
    return boards.value.filter(board => board.type === 'object')
  })

  // Доски типа 'general' (общие)
  const generalBoards = computed(() => {
    return boards.value.filter(board => board.type === 'general')
  })

  // Статистика по доскам
  const boardsStats = computed(() => {
    return {
      total: boards.value.length,
      objectBoards: objectBoards.value.length,
      generalBoards: generalBoards.value.length
    }
  })

  // ============ ACTIONS ============
  
  // Получить все доски
  async function fetchBoards() {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ boards: Board[], total: number }>('/api/boards', {
        method: 'GET'
      })

      boards.value = response.boards || []
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке досок'
      console.error('Failed to fetch boards:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Получить доску по ID
  async function fetchBoardById(id: number) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ board: Board }>(`/api/boards/${id}`, {
        method: 'GET'
      })

      // Обновляем доску в списке или добавляем новую
      const index = boards.value.findIndex(board => board.id === id)
      if (index !== -1) {
        boards.value[index] = response.board
      } else {
        boards.value.push(response.board)
      }

      return response.board
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке доски'
      console.error('Failed to fetch board:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Создать новую доску
  async function createBoard(data: CreateBoardData) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, board: Board }>('/api/boards', {
        method: 'POST',
        body: data
      })

      // Добавляем новую доску в начало списка
      if (response.board) {
        boards.value.unshift(response.board)
      }

      return response.board
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при создании доски'
      console.error('Failed to create board:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Обновить доску
  async function updateBoard(id: number, data: UpdateBoardData) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, board: Board }>(`/api/boards/${id}`, {
        method: 'PUT',
        body: data
      })

      // Обновляем доску в списке
      const index = boards.value.findIndex(board => board.id === id)
      if (index !== -1 && response.board) {
        boards.value[index] = response.board
      }

      return response.board
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении доски'
      console.error('Failed to update board:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Удалить доску
  async function deleteBoard(id: number) {
    loading.value = true
    error.value = null

    try {
      await $fetch<{ success: boolean, message: string }>(`/api/boards/${id}`, {
        method: 'DELETE'
      })

      // Удаляем доску из списка
      boards.value = boards.value.filter(board => board.id !== id)

      // Если удалённая доска была выбрана, сбрасываем выбор
      if (selectedBoardId.value === id) {
        selectedBoardId.value = null
      }

      return true
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при удалении доски'
      console.error('Failed to delete board:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Выбрать доску
  function selectBoard(id: number | null) {
    selectedBoardId.value = id
  }

  // Очистить состояние
  function clearState() {
    boards.value = []
    selectedBoardId.value = null
    error.value = null
  }

  // ============ ВОЗВРАТ ============
  
  return {
    // State
    boards,
    loading,
    error,
    selectedBoardId,

    // Getters
    allBoards,
    selectedBoard,
    objectBoards,
    generalBoards,
    boardsStats,

    // Actions
    fetchBoards,
    fetchBoardById,
    createBoard,
    updateBoard,
    deleteBoard,
    selectBoard,
    clearState
  }
})
