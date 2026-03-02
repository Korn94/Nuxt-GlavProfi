<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sections/Description.vue -->
<template>
  <div class="task-section description-section">
    <div class="section-header">
      <h3 class="section-title">
        <Icon name="mdi:text-box-outline" size="20" />
        Описание
      </h3>
      <button
        v-if="!isEditing"
        class="btn btn-sm btn-text"
        @click="startEditing"
        title="Редактировать описание"
      >
        <Icon name="mdi:pencil" size="16" />
        Редактировать
      </button>
    </div>
    
    <!-- Режим просмотра -->
    <div v-if="!isEditing" class="description-content">
      <div v-if="task.description" class="description-text">
        <p v-for="(paragraph, index) in paragraphs" :key="index">
          {{ paragraph }}
        </p>
      </div>
      <div v-else class="description-empty">
        <Icon name="mdi:file-document-outline" size="48" />
        <p>Описание отсутствует</p>
        <span class="empty-hint">Нажмите "Редактировать", чтобы добавить описание</span>
      </div>
    </div>
    
    <!-- Режим редактирования -->
    <div v-else class="description-editor">
      <textarea
        ref="textareaRef"
        v-model="editedDescription"
        class="form-control description-textarea"
        placeholder="Введите описание задачи..."
        rows="6"
        @keydown.ctrl.enter="saveDescription"
        @keydown.meta.enter="saveDescription"
      ></textarea>
      
      <div class="editor-actions">
        <div class="editor-hints">
          <span class="hint">
            <Icon name="mdi:keyboard" size="14" />
            Ctrl+Enter для сохранения
          </span>
          <span v-if="charCount > 0" class="char-count">
            {{ charCount }} символов
          </span>
        </div>
        <div class="editor-buttons">
          <button
            class="btn btn-secondary"
            @click="cancelEditing"
            :disabled="saving"
          >
            Отмена
          </button>
          <button
            class="btn btn-primary"
            @click="saveDescription"
            :disabled="saving || !canSave"
          >
            <Icon v-if="saving" name="mdi:loading" size="16" class="spin" />
            <Icon v-else name="mdi:check" size="16" />
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useTasksStore } from 'stores/boards/tasks'
import { useNotifications } from '~/composables/useNotifications'
import type { Task } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
}>()

const emit = defineEmits<{
  updated: []
}>()

// ============================================
// STORES
// ============================================
const tasksStore = useTasksStore()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const isEditing = ref(false)
const editedDescription = ref('')
const saving = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// ============================================
// COMPUTED
// ============================================
const paragraphs = computed(() => {
  if (!props.task.description) return []
  return props.task.description.split('\n').filter(p => p.trim() !== '')
})

const canSave = computed(() => {
  return editedDescription.value.trim() !== props.task.description?.trim()
})

const charCount = computed(() => {
  return editedDescription.value.length
})

// ============================================
// METHODS
// ============================================
const startEditing = async () => {
  editedDescription.value = props.task.description || ''
  isEditing.value = true
  
  // Фокус на textarea после рендера
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.focus()
    textareaRef.value.select()
  }
}

const cancelEditing = () => {
  editedDescription.value = props.task.description || ''
  isEditing.value = false
}

const saveDescription = async () => {
  const newDescription = editedDescription.value.trim()
  
  if (newDescription === props.task.description?.trim()) {
    cancelEditing()
    return
  }
  
  saving.value = true
  
  try {
    await tasksStore.updateTaskOptimistic(props.task.id, {
      description: newDescription || undefined
    })
    
    notifications.success('Описание сохранено')
    emit('updated')
    cancelEditing()
  } catch (error) {
    console.error('Failed to save description:', error)
    notifications.error('Не удалось сохранить описание')
  } finally {
    saving.value = false
  }
}

const autoResizeTextarea = () => {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
  }
}

// ============================================
// WATCHERS
// ============================================
watch(() => props.task.description, (newDesc) => {
  if (!isEditing.value) {
    editedDescription.value = newDesc || ''
  }
})

watch(isEditing, (newValue) => {
  if (newValue) {
    nextTick(() => {
      autoResizeTextarea()
    })
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.section-title {
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

// Режим просмотра
.description-content {
  min-height: 100px;
}

.description-text {
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 15px;
  
  p {
    margin: 0 0 12px 0;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.description-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  
  .icon {
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: #94a3b8;
  }
  
  .empty-hint {
    font-size: 13px;
    color: #64748b;
  }
}

// Режим редактирования
.description-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.description-textarea {
  width: 100%;
  padding: 14px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: $text-light;
  font-size: 15px;
  font-family: inherit;
  line-height: 1.6;
  resize: vertical;
  min-height: 150px;
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

.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.editor-hints {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    
    .icon {
      color: #475569;
    }
  }
  
  .char-count {
    font-size: 12px;
    color: #64748b;
    
    &.warning {
      color: $yellow;
    }
    
    &.danger {
      color: $red;
    }
  }
}

.editor-buttons {
  display: flex;
  gap: 10px;
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
    background: lighten($blue, 5%);
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

// Анимации
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
  .task-section {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .editor-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .editor-hints {
    order: 2;
  }
  
  .editor-buttons {
    order: 1;
    width: 100%;
    
    .btn {
      flex: 1;
    }
  }
}
</style>