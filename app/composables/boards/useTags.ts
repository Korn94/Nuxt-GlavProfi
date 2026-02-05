// app/composables/boards/useTags.ts
import { useTagsStore } from '../../../stores/boards/tags'

export function useTags() {
  const tagsStore = useTagsStore()

  // Получить все теги
  const fetchAllTags = async () => {
    try {
      await tagsStore.fetchTags()
      return tagsStore.allTags
    } catch (error) {
      console.error('Error fetching tags:', error)
      throw error
    }
  }

  // Получить теги задачи
  const fetchTaskTags = async (taskId: number) => {
    try {
      const tags = await tagsStore.fetchTaskTags(taskId)
      return tags
    } catch (error) {
      console.error('Error fetching task tags:', error)
      throw error
    }
  }

  // Создать новый тег
  const createTag = async (
    data: {
      name: string
      color?: string
    }
  ) => {
    try {
      const tag = await tagsStore.createTag(data)
      return tag
    } catch (error) {
      console.error('Error creating tag:', error)
      throw error
    }
  }

  // Обновить тег
  const updateTag = async (
    id: number,
    data: {
      name?: string
      color?: string
    }
  ) => {
    try {
      const tag = await tagsStore.updateTag(id, data)
      return tag
    } catch (error) {
      console.error('Error updating tag:', error)
      throw error
    }
  }

  // Удалить тег
  const deleteTag = async (id: number) => {
    try {
      await tagsStore.deleteTag(id)
      return true
    } catch (error) {
      console.error('Error deleting tag:', error)
      throw error
    }
  }

  // Добавить теги к задаче
  const addTagsToTask = async (taskId: number, tagIds: number[]) => {
    try {
      await tagsStore.addTagsToTask(taskId, tagIds)
      
      // Обновляем теги задачи
      await fetchTaskTags(taskId)
      
      return true
    } catch (error) {
      console.error('Error adding tags to task:', error)
      throw error
    }
  }

  // Удалить тег из задачи
  const removeTagFromTask = async (taskId: number, tagId: number) => {
    try {
      await tagsStore.removeTagFromTask(taskId, tagId)
      
      // Обновляем теги задачи
      await fetchTaskTags(taskId)
      
      return true
    } catch (error) {
      console.error('Error removing tag from task:', error)
      throw error
    }
  }

  // Получить тег по ID
  const getTagById = (id: number) => {
    return tagsStore.getTagById(id)
  }

  // Получить тег по названию
  const getTagByName = (name: string) => {
    return tagsStore.getTagByName(name)
  }

  // Очистить состояние
  const clearTags = () => {
    tagsStore.clearState()
  }

  return {
    // State
    tags: tagsStore.allTags,
    loading: tagsStore.loading,
    error: tagsStore.error,

    // Actions
    fetchAllTags,
    fetchTaskTags,
    createTag,
    updateTag,
    deleteTag,
    addTagsToTask,
    removeTagFromTask,
    getTagById,
    getTagByName,
    clearTags
  }
}
