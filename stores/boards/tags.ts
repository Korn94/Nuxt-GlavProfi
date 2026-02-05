// stores/boards/tags.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Tag } from '~/types/boards'

export const useTagsStore = defineStore('tags', () => {
  // ============ STATE ============
  
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ============ GETTERS ============
  
  // Все теги
  const allTags = computed(() => tags.value)

  // Тег по ID
  function getTagById(id: number) {
    return computed(() => {
      return tags.value.find(tag => tag.id === id)
    })
  }

  // Тег по названию
  function getTagByName(name: string) {
    return computed(() => {
      return tags.value.find(tag => tag.name.toLowerCase() === name.toLowerCase())
    })
  }

  // ============ ACTIONS ============
  
  // Получить все теги
  async function fetchTags() {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ tags: Tag[], total: number }>('/api/tags', {
        method: 'GET'
      })

      tags.value = response.tags || []
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке тегов'
      console.error('Failed to fetch tags:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Получить теги задачи
  async function fetchTaskTags(taskId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ tags: Tag[], total: number }>(
        `/api/tasks/${taskId}/tags`,
        {
          method: 'GET'
        }
      )

      // Обновляем теги в общем списке
      response.tags.forEach(newTag => {
        const existingTag = tags.value.find(tag => tag.id === newTag.id)
        if (!existingTag) {
          tags.value.push(newTag)
        }
      })

      return response.tags
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при загрузке тегов задачи'
      console.error('Failed to fetch task tags:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Создать новый тег
  async function createTag(data: { name: string, color?: string }) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, tag: Tag }>('/api/tags', {
        method: 'POST',
        body: data
      })

      // Добавляем новый тег в список
      if (response.tag) {
        tags.value.push(response.tag)
      }

      return response.tag
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при создании тега'
      console.error('Failed to create tag:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Обновить тег
  async function updateTag(id: number, data: { name?: string, color?: string }) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, tag: Tag }>(`/api/tags/${id}`, {
        method: 'PUT',
        body: data
      })

      // Обновляем тег в списке
      const index = tags.value.findIndex(tag => tag.id === id)
      if (index !== -1 && response.tag) {
        tags.value[index] = response.tag
      }

      return response.tag
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при обновлении тега'
      console.error('Failed to update tag:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Удалить тег
  async function deleteTag(id: number) {
    loading.value = true
    error.value = null

    try {
      await $fetch<{ success: boolean, message: string }>(`/api/tags/${id}`, {
        method: 'DELETE'
      })

      // Удаляем тег из списка
      tags.value = tags.value.filter(tag => tag.id !== id)

      return true
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при удалении тега'
      console.error('Failed to delete tag:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Добавить теги к задаче
  async function addTagsToTask(taskId: number, tagIds: number[]) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, message: string }>(
        `/api/tasks/${taskId}/tags`,
        {
          method: 'POST',
          body: { tagIds }
        }
      )

      return response
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при добавлении тегов к задаче'
      console.error('Failed to add tags to task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Удалить тег из задачи
  async function removeTagFromTask(taskId: number, tagId: number) {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean, message: string }>(
        `/api/tasks/${taskId}/tags/${tagId}`,
        {
          method: 'DELETE'
        }
      )

      return response
    } catch (err: any) {
      error.value = err.data?.statusMessage || 'Ошибка при удалении тега из задачи'
      console.error('Failed to remove tag from task:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Очистить состояние
  function clearState() {
    tags.value = []
    error.value = null
  }

  // ============ ВОЗВРАТ ============
  
  return {
    // State
    tags,
    loading,
    error,

    // Getters
    allTags,
    getTagById,
    getTagByName,

    // Actions
    fetchTags,
    fetchTaskTags,
    createTag,
    updateTag,
    deleteTag,
    addTagsToTask,
    removeTagFromTask,
    clearState
  }
})
