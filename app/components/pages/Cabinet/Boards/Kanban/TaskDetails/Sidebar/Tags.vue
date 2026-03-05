<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sidebar/Tags.vue -->
<template>
  <div class="task-sidebar-section task-tags-section">
    <div class="task-sidebar-header">
      <h4 class="task-sidebar-title">
        <Icon name="mdi:tag-outline" size="18" />
        Теги
      </h4>
      <button
        class="btn btn-sm btn-secondary"
        @click="toggleSelector"
        :class="{ active: isSelectorOpen }"
        title="Управление тегами"
      >
        <Icon name="mdi:plus" size="16" />
      </button>
    </div>
    
    <!-- Выбранные теги -->
    <div v-if="selectedTags.length > 0" class="task-tags-list">
      <TransitionGroup name="tag-list" tag="div" class="tags-container">
        <span
          v-for="tag in selectedTags"
          :key="tag.id"
          class="task-tag"
          :style="{ backgroundColor: tag.color }"
        >
          {{ tag.name }}
          <button
            class="tag-remove"
            @click="removeTag(tag.id)"
            title="Удалить тег"
          >
            <Icon name="mdi:close" size="12" />
          </button>
        </span>
      </TransitionGroup>
    </div>
    
    <!-- Пустое состояние -->
    <div v-else class="tags-empty">
      <Icon name="mdi:tag-off-outline" size="32" />
      <p>Нет тегов</p>
      <span class="empty-hint">Нажмите "+", чтобы добавить теги</span>
    </div>
    
    <!-- Селектор тегов -->
    <Transition name="selector-slide">
      <div v-if="isSelectorOpen" class="tag-selector">
        <!-- Поиск тегов -->
        <div class="tag-selector-search">
          <Icon name="mdi:magnify" size="16" class="search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="form-control"
            placeholder="Поиск тегов..."
          />
        </div>
        
        <!-- Список доступных тегов -->
        <div class="tag-selector-list">
          <div v-if="loading" class="tag-selector-loading">
            <Icon name="mdi:loading" size="24" class="spin" />
            <span>Загрузка...</span>
          </div>
          
          <div v-else-if="filteredTags.length === 0" class="tag-selector-empty">
            <Icon name="mdi:tag-search-outline" size="32" />
            <p>Теги не найдены</p>
            <button class="btn btn-sm btn-primary" @click="showCreateTag = true">
              Создать тег
            </button>
          </div>
          
          <div v-else class="tag-selector-options">
            <button
              v-for="tag in filteredTags"
              :key="tag.id"
              class="tag-selector-option"
              :class="{ selected: isSelected(tag.id) }"
              @click="toggleTag(tag)"
            >
              <span
                class="tag-color-indicator"
                :style="{ backgroundColor: tag.color }"
              ></span>
              <span class="tag-name">{{ tag.name }}</span>
              <Icon
                v-if="isSelected(tag.id)"
                name="mdi:check"
                size="16"
                class="tag-check"
              />
            </button>
          </div>
        </div>
        
        <!-- Кнопка создания нового тега -->
        <div class="tag-selector-footer">
          <button
            class="btn btn-text btn-create-tag"
            @click="showCreateTag = true"
          >
            <Icon name="mdi:tag-plus" size="16" />
            Создать новый тег
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Модалка создания тега -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showCreateTag" class="modal-overlay" @click="closeCreateTag">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>Создать тег</h3>
              <button class="modal-close" @click="closeCreateTag">
                <Icon name="mdi:close" size="24" />
              </button>
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
                    autofocus
                  />
                </div>
                <div class="form-group">
                  <label for="tag-color">Цвет</label>
                  <div class="color-picker-wrapper">
                    <input
                      id="tag-color"
                      v-model="newTag.color"
                      type="color"
                      class="form-control-color"
                    />
                    <span
                      class="color-preview"
                      :style="{ backgroundColor: newTag.color }"
                    ></span>
                    <div class="color-presets">
                      <button
                        v-for="color in colorPresets"
                        :key="color"
                        type="button"
                        class="color-preset"
                        :style="{ backgroundColor: color }"
                        :class="{ selected: newTag.color === color }"
                        @click="newTag.color = color"
                      ></button>
                    </div>
                  </div>
                </div>
                <div class="modal-actions">
                  <button
                    type="button"
                    class="btn btn-secondary"
                    @click="closeCreateTag"
                    :disabled="creatingTag"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="creatingTag || !canCreateTag"
                  >
                    <Icon
                      v-if="creatingTag"
                      name="mdi:loading"
                      size="16"
                      class="spin"
                    />
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
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useTagsStore } from 'stores/boards/tags'
import { useNotifications } from '~/composables/useNotifications'
import type { Tag } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: any // Task type
  boardId?: number
}>()

const emit = defineEmits<{
  updated: []
}>()

// ============================================
// STORES
// ============================================
const tagsStore = useTagsStore()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const isSelectorOpen = ref(false)
const searchQuery = ref('')
const showCreateTag = ref(false)
const creatingTag = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)

const newTag = ref({
  name: '',
  color: '#00c3f5'
})

// ============================================
// COMPUTED
// ============================================
const selectedTags = computed<Tag[]>(() => {
  if (!props.task.tags) return []
  return props.task.tags
})

const allTags = computed<Tag[]>(() => {
  return tagsStore.allTags
})

const filteredTags = computed<Tag[]>(() => {
  if (!searchQuery.value.trim()) return allTags.value
  
  const query = searchQuery.value.toLowerCase().trim()
  return allTags.value.filter(tag =>
    tag.name.toLowerCase().includes(query)
  )
})

const loading = computed(() => {
  return tagsStore.loading
})

const canCreateTag = computed(() => {
  return newTag.value.name.trim().length > 0 &&
         newTag.value.name.trim().length <= 50
})

const colorPresets = [
  '#00c3f5', // Blue
  '#00A12A', // Green
  '#A61300', // Red
  '#FAB702', // Yellow
  '#7c3aed', // Purple
  '#e83e8c', // Pink
  '#17a2b8', // Cyan
  '#fd7e14'  // Orange
]

// ============================================
// METHODS
// ============================================
const isSelected = (tagId: number): boolean => {
  return selectedTags.value.some(tag => tag.id === tagId)
}

const toggleTag = async (tag: Tag) => {
  if (isSelected(tag.id)) {
    await removeTag(tag.id)
  } else {
    await addTag(tag.id)
  }
}

const addTag = async (tagId: number) => {
  try {
    await $fetch(`/api/boards/tasks/${props.task.id}/tags`, {
      method: 'POST',
      body: { tagIds: [tagId] }
    })
    
    notifications.success('Тег добавлен')
    emit('updated')
  } catch (error) {
    console.error('Failed to add tag:', error)
    notifications.error('Не удалось добавить тег')
  }
}

const removeTag = async (tagId: number) => {
  try {
    await $fetch(`/api/boards/tasks/${props.task.id}/tags/${tagId}`, {
      method: 'DELETE'
    })
    
    notifications.success('Тег удалён')
    emit('updated')
  } catch (error) {
    console.error('Failed to remove tag:', error)
    notifications.error('Не удалось удалить тег')
  }
}

const toggleSelector = async () => {
  isSelectorOpen.value = !isSelectorOpen.value
  
  if (isSelectorOpen.value) {
    // Загружаем теги если ещё не загружены
    if (allTags.value.length === 0) {
      await tagsStore.fetchTags()
    }
    
    // Фокус на поле поиска
    await nextTick()
    if (searchInputRef.value) {
      searchInputRef.value.focus()
    }
  }
}

const closeCreateTag = () => {
  showCreateTag.value = false
  newTag.value = {
    name: '',
    color: '#00c3f5'
  }
}

const handleCreateTag = async () => {
  if (!canCreateTag.value) return
  
  creatingTag.value = true
  
  try {
    const tag = await tagsStore.createTag({
      name: newTag.value.name.trim(),
      color: newTag.value.color
    })
    
    if (tag) {
      // Сразу добавляем созданный тег к задаче
      await addTag(tag.id)
      notifications.success(`Тег "${tag.name}" создан и добавлен`)
    }
    
    closeCreateTag()
    isSelectorOpen.value = true
  } catch (error: any) {
    console.error('Failed to create tag:', error)
    const message = error.data?.message || 'Не удалось создать тег'
    notifications.error(message)
  } finally {
    creatingTag.value = false
  }
}

const closeSelectorOnClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (isSelectorOpen.value && !target.closest('.task-tags-section')) {
    isSelectorOpen.value = false
  }
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  document.addEventListener('click', closeSelectorOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeSelectorOnClickOutside)
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-sidebar-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.task-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: $text-light;
  
  .icon {
    color: $blue;
  }
}

// Список тегов
.task-tags-list {
  margin-bottom: 16px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: $text-light;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.2);
  border: none;
  color: $text-light;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  
  &:hover {
    background: rgba(0, 0, 0, 0.4);
    transform: scale(1.1);
  }
}

// Пустое состояние
.tags-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  color: #64748b;
  
  .icon {
    margin-bottom: 12px;
    opacity: 0.5;
    color: #475569;
  }
  
  p {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #94a3b8;
  }
  
  .empty-hint {
    font-size: 12px;
    color: #64748b;
  }
}

// Селектор тегов
.tag-selector {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #334155;
}

.tag-selector-search {
  position: relative;
  margin-bottom: 12px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  z-index: 1;
}

.form-control {
  width: 100%;
  padding: 10px 12px 10px 36px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: $text-light;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
}

.tag-selector-list {
  max-height: 240px;
  overflow-y: auto;
  margin-bottom: 12px;
  
  // Стили скроллбара
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #0f172a;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 3px;
    
    &:hover {
      background: #64748b;
    }
  }
}

.tag-selector-loading,
.tag-selector-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  text-align: center;
  color: #64748b;
  
  .icon {
    margin-bottom: 12px;
    opacity: 0.5;
    color: #475569;
  }
  
  p {
    margin: 0 0 12px 0;
    font-size: 14px;
  }
}

.tag-selector-options {
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
    border: 1px solid rgba($blue, 0.3);
  }
}

.tag-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tag-name {
  flex: 1;
}

.tag-check {
  color: $green;
  flex-shrink: 0;
}

.tag-selector-footer {
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.btn-create-tag {
  width: 100%;
  justify-content: center;
  color: $blue;
  
  &:hover {
    background: color.adjust($blue, $lightness: 5%);
    background: rgba($blue, 0.1);
  }
}

// Модалка создания тега
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.modal {
  background: #1e293b;
  border-radius: 12px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #334155;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $text-light;
  }
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #334155;
    color: $text-light;
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #94a3b8;
  }
}

// Выбор цвета
.color-picker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-control-color {
  width: 100%;
  height: 48px;
  border: 1px solid #334155;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  padding: 0;
  
  &::-webkit-color-swatch-wrapper {
    padding: 0;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
  }
  
  &::-moz-color-swatch {
    border: none;
    border-radius: 8px;
  }
}

.color-preview {
  display: none;
}

.color-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-preset {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
  
  &.selected {
    border-color: $text-light;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #334155;
}

// Кнопки
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-text {
  background: transparent;
  color: $blue;
  
  &:hover:not(:disabled) {
    background: rgba($blue, 0.1);
  }
}

.btn-primary {
  background: $blue;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: color.adjust($blue, $lightness: 5%);
    transform: translateY(-1px);
  }
}

.btn-secondary {
  background: #475569;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #64748b;
  }
}

.btn.active {
  background: rgba($blue, 0.2);
  color: $blue;
  border-color: rgba($blue, 0.3);
}

// Анимации
.tag-list-enter-active,
.tag-list-leave-active {
  transition: all 0.3s ease;
}

.tag-list-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.tag-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

.selector-slide-enter-active,
.selector-slide-leave-active {
  transition: all 0.3s ease;
}

.selector-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.selector-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Адаптивность
@media (max-width: 768px) {
  .task-sidebar-section {
    padding: 16px;
  }
  
  .modal {
    max-width: 95%;
  }
  
  .color-presets {
    justify-content: center;
  }
}
</style>