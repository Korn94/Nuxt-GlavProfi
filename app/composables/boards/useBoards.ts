// app/composables/boards/useBoards.ts
import { useBoardsStore } from '../../../stores/boards'

export function useBoards() {
  const boardsStore = useBoardsStore()

  // Получить все доски
  const fetchAllBoards = async () => {
    try {
      await boardsStore.fetchBoards()
      return boardsStore.allBoards
    } catch (error) {
      console.error('Error fetching boards:', error)
      throw error
    }
  }

  // Получить доску по ID
  const fetchBoard = async (id: number) => {
    try {
      const board = await boardsStore.fetchBoardById(id)
      return board
    } catch (error) {
      console.error('Error fetching board:', error)
      throw error
    }
  }

  // Создать новую доску
  const createBoard = async (
    data: {
      name: string
      description?: string
      type?: 'object' | 'general'
      objectId?: number
    }
  ) => {
    try {
      const board = await boardsStore.createBoard(data)
      return board
    } catch (error) {
      console.error('Error creating board:', error)
      throw error
    }
  }

  // Обновить доску
  const updateBoard = async (
    id: number,
    data: {
      name?: string
      description?: string
      type?: 'object' | 'general'
      objectId?: number | null
    }
  ) => {
    try {
      const board = await boardsStore.updateBoard(id, data)
      return board
    } catch (error) {
      console.error('Error updating board:', error)
      throw error
    }
  }

  // Удалить доску
  const deleteBoard = async (id: number) => {
    try {
      await boardsStore.deleteBoard(id)
      return true
    } catch (error) {
      console.error('Error deleting board:', error)
      throw error
    }
  }

  // Выбрать доску
  const selectBoard = (id: number | null) => {
    boardsStore.selectBoard(id)
  }

  // Очистить состояние
  const clearBoards = () => {
    boardsStore.clearState()
  }

  return {
    // State
    boards: boardsStore.allBoards,
    selectedBoard: boardsStore.selectedBoard,
    objectBoards: boardsStore.objectBoards,
    generalBoards: boardsStore.generalBoards,
    boardsStats: boardsStore.boardsStats,
    loading: boardsStore.loading,
    error: boardsStore.error,

    // Actions
    fetchAllBoards,
    fetchBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    selectBoard,
    clearBoards
  }
}
