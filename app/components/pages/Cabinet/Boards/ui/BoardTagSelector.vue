<!-- app\components\pages\Cabinet\Boards\ui\BoardTagSelector.vue -->
<template>
  <div class="board-tag-selector">
    <div class="board-tag-selector-label">
      <label>Теги</label>
      <button class="btn btn-sm btn-text" @click="showCreateTag = true">
        Создать новый
      </button>
    </div>

    <div class="board-tag-selector-selected">
      <BoardTag
        v-for="tag in selectedTags"
        :key="tag.id"
        :tag="tag"
        :show-remove="true"
        @remove="removeTag(tag.id)"
      />
    </div>

    <div class="board-tag-selector-dropdown">
      <input
        v-model="searchQuery"
        type="text"
        class="form-control"
        placeholder="Поиск тегов..."
      />
      
      <div class="board-tag-selector-options">
        <div v-if="tagsComposable.loading" class="board-tag-selector-loading">
          <div class="spinner"></div>
        </div>
        
        <div v-else-if="filteredTags.length === 0" class="board-tag-selector-empty">
          <p>Теги не найдены</p>
        </div>
        
        <div v-else class="board-tag-selector-list">
          <button
            v-for="tag in filteredTags"
            :key="tag.id"
            class="board-tag-selector-option"
            :class="{ selected: isSelected(tag.id) }"
            @click="toggleTag(tag)"
          >
            <span class="board-tag-selector-option-color" :style="{ backgroundColor: tag.color }"></span>
            <span class="board-tag-selector-option-name">{{ tag.name }}</span>
            <span v-if="isSelected(tag.id)" class="board-tag-selector-option-check">✓</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка создания тега -->
    <div v-if="showCreateTag" class="modal-overlay" @click="showCreateTag = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Создать тег</h2>
          <button class="modal-close" @click="showCreateTag = false">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateTag">
            <div class="form-group">
              <label for="tag-name">Название *</label>
              <input
                id="tag-name"
                v-model="newTag.name"
                type="text"
                class="form-control"
                placeholder="Введите название тега"
                required
              />
            </div>

            <div class="form-group">
              <label for="tag-color">Цвет</label>
              <input
                id="tag-color"
                v-model="newTag.color"
                type="color"
                class="form-control-color"
                value="#6b7280"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="showCreateTag = false">
                Отмена
              </button>
              <button type="submit" class="btn btn-primary" :disabled="creatingTag">
                {{ creatingTag ? 'Создание...' : 'Создать' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTags } from '~/composables/boards/useTags'
import BoardTag from './BoardTag.vue'
import type { Tag } from '~/types/boards'

// Props и Emits
interface Props {
  modelValue: number[]
}

interface Emits {
  (e: 'update:modelValue', value: number[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables - используем напрямую в вычислениях
const tagsComposable = useTags()

// State
const searchQuery = ref('')
const showCreateTag = ref(false)
const creatingTag = ref(false)

const newTag = ref({
  name: '',
  color: '#6b7280'
})

// Computed - используем tagsComposable.tags напрямую
const selectedTags = computed(() => {
  return tagsComposable.tags.filter((tag: Tag) => props.modelValue.includes(tag.id))
})

const filteredTags = computed(() => {
  if (!searchQuery.value) return tagsComposable.tags
  const query = searchQuery.value.toLowerCase()
  return tagsComposable.tags.filter((tag: Tag) =>
    tag.name.toLowerCase().includes(query)
  )
})

// Methods
const isSelected = (tagId: number): boolean => {
  return props.modelValue.includes(tagId)
}

const toggleTag = (tag: Tag) => {
  const newSelection = [...props.modelValue]
  const index = newSelection.indexOf(tag.id)
  
  if (index > -1) {
    newSelection.splice(index, 1)
  } else {
    newSelection.push(tag.id)
  }
  
  emit('update:modelValue', newSelection)
}

const removeTag = (tagId: number) => {
  const newSelection = props.modelValue.filter(id => id !== tagId)
  emit('update:modelValue', newSelection)
}

const handleCreateTag = async () => {
  creatingTag.value = true
  
  try {
    const tag = await tagsComposable.createTag({
      name: newTag.value.name,
      color: newTag.value.color
    })
    
    if (tag) {
      emit('update:modelValue', [...props.modelValue, tag.id])
    }
    
    showCreateTag.value = false
    newTag.value = { name: '', color: '#6b7280' }
  } catch (error) {
    console.error('Failed to create tag:', error)
  } finally {
    creatingTag.value = false
  }
}

// Lifecycle
onMounted(() => {
  tagsComposable.fetchAllTags()
})
</script>

<style scoped lang="scss">
/* ... стили без изменений ... */
.board-tag-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-tag-selector-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.board-tag-selector-label label {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
}

.btn-sm {
  padding: 4px 10px;
  font-size: 13px;
}

.btn-text {
  background: none;
  border: none;
  color: #60a5fa;
  cursor: pointer;
  
  &:hover {
    color: #3b82f6;
    text-decoration: underline;
  }
}

.board-tag-selector-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #1e293b;
  border-radius: 8px;
}

.board-tag-selector-dropdown {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &::placeholder {
    color: #64748b;
  }
}

.board-tag-selector-options {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px;
}

.board-tag-selector-loading,
.board-tag-selector-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #334155;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.board-tag-selector-empty p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.board-tag-selector-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.board-tag-selector-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #0f172a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;
  
  &:hover {
    background: #1e293b;
  }
  
  &.selected {
    background: #1e3a8a;
  }
}

.board-tag-selector-option-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.board-tag-selector-option-name {
  flex: 1;
  text-align: left;
}

.board-tag-selector-option-check {
  color: #10b981;
  font-weight: bold;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #111827;
  border-radius: 12px;
  max-width: 400px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  
  &:hover {
    color: #fff;
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #fff;
  font-weight: 500;
}

.form-control-color {
  width: 60px;
  height: 40px;
  border: 1px solid #374151;
  border-radius: 6px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #374151;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: #4b5563;
  color: #fff;
  
  &:hover {
    background: #374151;
  }
}
</style>