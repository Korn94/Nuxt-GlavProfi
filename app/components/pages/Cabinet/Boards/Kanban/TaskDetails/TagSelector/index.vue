<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/TagSelector/index.vue -->
<template>
  <div class="tag-selector">
    <div class="tag-selector-label">
      <label>Теги задачи</label>
      <button class="btn btn-sm btn-text" @click="showCreateTag = true" title="Создать новый тег">
        <Icon name="mdi:tag-plus" size="16" />
        Создать
      </button>
    </div>

    <div class="tag-selector-selected">
      <Tag v-for="tag in selectedTags" :key="tag.id" :tag="tag" :show-remove="true" @remove="removeTag(tag.id)" />
    </div>

    <div class="tag-selector-dropdown">
      <input v-model="searchQuery" type="text" class="form-control" placeholder="Поиск тегов..."
        @focus="isDropdownOpen = true" @blur="handleBlur" />
      <div v-if="isDropdownOpen" class="tag-selector-options">
        <div v-if="loading" class="tag-selector-loading">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>
        <div v-else-if="filteredTags.length === 0" class="tag-selector-empty">
          <p>Теги не найдены</p>
        </div>
        <div v-else class="tag-selector-list">
          <button v-for="tag in filteredTags" :key="tag.id" class="tag-selector-option"
            :class="{ selected: isSelected(tag.id) }" @click="toggleTag(tag)">
            <span class="tag-selector-option-color" :style="{ backgroundColor: tag.color }"></span>
            <span class="tag-selector-option-name">{{ tag.name }}</span>
            <span v-if="isSelected(tag.id)" class="tag-selector-option-check">✓</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Модалка создания тега -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showCreateTag" class="modal-overlay" @click="showCreateTag = false">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h2>Создать тег</h2>
              <button class="modal-close" @click="showCreateTag = false" aria-label="Закрыть">
                <Icon name="mdi:close" size="24" />
              </button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="handleCreateTag">
                <div class="form-group">
                  <label for="tag-name">Название *</label>
                  <input id="tag-name" v-model="newTag.name" type="text" class="form-control"
                    placeholder="Введите название тега" required autofocus />
                </div>
                <div class="form-group">
                  <label for="tag-color">Цвет</label>
                  <div class="color-picker-wrapper">
                    <input id="tag-color" v-model="newTag.color" type="color" class="form-control-color"
                      :value="newTag.color" />
                    <span class="color-preview" :style="{ backgroundColor: newTag.color }"></span>
                  </div>
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
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useTagsStore } from 'stores/boards/tags'
import { useNotifications } from '~/composables/useNotifications'
import Tag from './Tag.vue'
import type { Tag as TagType } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  modelValue: number[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

// ============================================
// STORES & COMPOSABLES
// ============================================
const tagsStore = useTagsStore()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const searchQuery = ref('')
const isDropdownOpen = ref(false)
const showCreateTag = ref(false)
const creatingTag = ref(false)
const newTag = ref({
  name: '',
  color: '#6b7280'
})

// ============================================
// COMPUTED
// ============================================
const selectedTags = computed(() => {
  return tagsStore.allTags.filter((tag: TagType) => props.modelValue.includes(tag.id))
})

const filteredTags = computed(() => {
  if (!searchQuery.value) return tagsStore.allTags
  const query = searchQuery.value.toLowerCase()
  return tagsStore.allTags.filter((tag: TagType) =>
    tag.name.toLowerCase().includes(query)
  )
})

const loading = computed(() => tagsStore.loading)

// ============================================
// METHODS
// ============================================
const isSelected = (tagId: number): boolean => {
  return props.modelValue.includes(tagId)
}

const toggleTag = (tag: TagType) => {
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
  if (!newTag.value.name.trim()) {
    notifications.warning('Введите название тега')
    return
  }

  creatingTag.value = true
  try {
    const tag = await tagsStore.createTag({
      name: newTag.value.name.trim(),
      color: newTag.value.color
    })
    if (tag) {
      emit('update:modelValue', [...props.modelValue, tag.id])
      notifications.success(`Тег "${tag.name}" создан`)
    }
    showCreateTag.value = false
    newTag.value = { name: '', color: '#6b7280' }
  } catch (error) {
    console.error('Failed to create tag:', error)
    notifications.error('Не удалось создать тег')
  } finally {
    creatingTag.value = false
  }
}

const handleBlur = () => {
  setTimeout(() => {
    isDropdownOpen.value = false
  }, 200)
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(async () => {
  if (tagsStore.allTags.length === 0) {
    await tagsStore.fetchTags()
  }
})

onUnmounted(() => {
  isDropdownOpen.value = false
})
</script>

<style scoped lang="scss">
.tag-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tag-selector-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag-selector-label label {
  font-size: 14px;
  font-weight: 600;
  color: $text-light;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-text {
  background: none;
  border: none;
  color: $blue;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s ease;

  // &:hover {
  //   color: darken($blue, 10%);
  //   text-decoration: underline;
  // }
}

.tag-selector-selected {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px;
  background: #1e293b;
  border-radius: 8px;
  min-height: 48px;
}

.tag-selector-dropdown {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: $text-light;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
}

.tag-selector-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 8px;
  max-height: 240px;
  overflow-y: auto;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tag-selector-loading,
.tag-selector-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #334155;
  border-top-color: $blue;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.tag-selector-empty p,
.tag-selector-loading p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

.tag-selector-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tag-selector-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #0f172a;
  border: none;
  border-radius: 6px;
  color: $text-light;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  text-align: left;

  &:hover {
    background: #1e293b;
  }

  &.selected {
    background: rgba($blue, 0.15);
    color: $blue;
  }
}

.tag-selector-option-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tag-selector-option-name {
  flex: 1;
  text-align: left;
}

.tag-selector-option-check {
  color: $green;
  font-weight: bold;
  font-size: 18px;
}

/* Color Picker */
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.form-control-color {
  width: 48px;
  height: 40px;
  border: 1px solid #374151;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
  padding: 0;
}

.color-preview {
  width: 48px;
  height: 40px;
  border-radius: 6px;
  border: 2px solid #374151;
  display: flex;
  align-items: center;
  justify-content: center;

  &::after {
    content: '';
    display: block;
    width: 80%;
    height: 80%;
    background: currentColor;
    border-radius: 4px;
  }
}

/* Modal */
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
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
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
  color: $text-light;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: $text-light;
    background: #374151;
  }
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: $text-light;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #374151;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: $blue;
  color: $text-light;

  // &:hover:not(:disabled) {
  //   background: darken($blue, 10%);
  // }
}

.btn-secondary {
  background: #4b5563;
  color: $text-light;

  &:hover:not(:disabled) {
    background: #374151;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>