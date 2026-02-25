// stores/boards/folders.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BoardFolder, CreateBoardFolderData, UpdateBoardFolderData } from '~/types/boards'

export const useBoardFoldersStore = defineStore('boardFolders', () => {
  // ============================================
  // STATE
  // ============================================
  const folders = ref<BoardFolder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const activeFolderId = ref<number | null>(null)
  const activeBoardId = ref<number | null>(null)

  // ============================================
  // GETTERS
  // ============================================
  // Все папки (отсортированные по порядку)
  const allFolders = computed(() => {
    return [...folders.value].sort((a, b) => a.order - b.order)
  })

  // Папки по категориям
  const foldersByCategory = computed(() => {
    return {
      objects: folders.value.filter(f => f.category === 'objects'),
      general: folders.value.filter(f => f.category === 'general')
    }
  })

  // Активная папка
  const activeFolder = computed(() => {
    if (!activeFolderId.value) return null
    return folders.value.find(folder => folder.id === activeFolderId.value)
  })

  // Статистика
  const foldersStats = computed(() => {
    return {
      total: folders.value.length,
      objects: folders.value.filter(f => f.category === 'objects').length,
      general: folders.value.filter(f => f.category === 'general').length
    }
  })

  // ============================================
  // ACTIONS
  // ============================================
  // Получить все папки
  async function fetchFolders() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ folders: BoardFolder[], total: number }>('/api/boards/folders', {
        method: 'GET'
      })
      folders.value = response.folders || []
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка при загрузке папок'
      console.error('❌ Ошибка загрузки папок:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Получить папку по ID
  async function fetchFolderById(id: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ folder: BoardFolder }>('/api/boards/folders/' + id, {
        method: 'GET'
      })
      // Обновляем папку в списке или добавляем новую
      const index = folders.value.findIndex(f => f.id === id)
      if (index !== -1) {
        folders.value[index] = response.folder
      } else {
        folders.value.push(response.folder)
      }
      return response.folder
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка при загрузке папки'
      console.error('❌ Ошибка загрузки папки:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Создать папку + первую доску
  async function createFolderWithBoard(data: {
    folder: CreateBoardFolderData
    firstBoard: {
      name: string
      description?: string
      type: 'object' | 'general'
      objectId?: number
    }
  }) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        success: boolean
        folder: BoardFolder
        board?: { id: number; name: string } | null // ✅ Явно указываем что board может быть null
      }>('/api/boards/folders', {
        method: 'POST',
        body: data
      })
      
      folders.value.unshift(response.folder)
      activeFolderId.value = response.folder.id
      
      if (response.board) {
        activeBoardId.value = response.board.id
      }
      
      return {
        folder: response.folder,
        board: response.board || null // ✅ Гарантируем возврат null вместо undefined
      }
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка при создании папки'
      console.error('❌ Ошибка создания папки:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Обновить папку
  async function updateFolder(id: number, data: UpdateBoardFolderData) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{ success: boolean, folder: BoardFolder }>(
        `/api/boards/folders/${id}`,
        {
          method: 'PUT',
          body: data
        }
      )
      
      // Обновляем папку в списке
      const index = folders.value.findIndex(f => f.id === id)
      if (index !== -1) {
        folders.value[index] = response.folder
      }
      
      return response.folder
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка при обновлении папки'
      console.error('❌ Ошибка обновления папки:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Удалить папку
  async function deleteFolder(id: number) {
    loading.value = true
    error.value = null
    try {
      await $fetch<{ success: boolean, message: string }>(
        `/api/boards/folders/${id}`,
        {
          method: 'DELETE'
        }
      )
      
      // Удаляем папку из списка
      folders.value = folders.value.filter(f => f.id !== id)
      
      // Если удалённая папка была активной, сбрасываем выбор
      if (activeFolderId.value === id) {
        activeFolderId.value = null
        activeBoardId.value = null
      }
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка при удалении папки'
      console.error('❌ Ошибка удаления папки:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Обновить порядок папок (Drag & Drop)
  async function updateFoldersOrder(updates: { id: number, order: number }[]) {
    loading.value = true
    error.value = null
    try {
      await $fetch<{ success: boolean, message: string }>('/api/boards/folders/order', {
        method: 'PUT',
        body: { updates }
      })
      
      // Обновляем порядок локально
      updates.forEach(update => {
        const folder = folders.value.find(f => f.id === update.id)
        if (folder) {
          folder.order = update.order
        }
      })
      
      return true
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка при обновлении порядка папок'
      console.error('❌ Ошибка обновления порядка:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Получить доски папки
  async function fetchBoardsInFolder(folderId: number) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch<{
        boards: any[] // Board[]
        total: number
        folderId: number
      }>(`/api/boards/folders/${folderId}/boards`, {
        method: 'GET'
      })
      
      return response.boards
    } catch (err: any) {
      error.value = err.data?.message || 'Ошибка при загрузке досок папки'
      console.error('❌ Ошибка загрузки досок папки:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Выбрать папку
  function selectFolder(id: number | null) {
    activeFolderId.value = id
    // При смене папки сбрасываем выбранную доску
    if (id !== activeFolderId.value) {
      activeBoardId.value = null
    }
  }

  // Выбрать доску
  function selectBoard(id: number | null) {
    activeBoardId.value = id
  }

  // Очистить состояние
  function clearState() {
    folders.value = []
    activeFolderId.value = null
    activeBoardId.value = null
    error.value = null
  }

  // ============================================
  // ВОЗВРАТ
  // ============================================
  return {
    // State
    folders,
    loading,
    error,
    activeFolderId,
    activeBoardId,
    
    // Getters
    allFolders,
    foldersByCategory,
    activeFolder,
    foldersStats,
    
    // Actions
    fetchFolders,
    fetchFolderById,
    createFolderWithBoard,
    updateFolder,
    deleteFolder,
    updateFoldersOrder,
    fetchBoardsInFolder,
    selectFolder,
    selectBoard,
    clearState
  }
})
