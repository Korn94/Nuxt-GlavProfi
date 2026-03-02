<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Subtasks/index.vue -->
<template>
  <div class="subtasks-tree">
    <!-- Форма добавления корневой подзадачи -->
    <div v-if="showAddForm" class="subtask-add-form">
      <div class="form-group">
        <input
          ref="titleInputRef"
          v-model="newSubtask.title"
          type="text"
          class="form-control"
          placeholder="Название подзадачи..."
          @keyup.enter="addSubtask"
          @keyup.esc="cancelAdd"
          autofocus
        />
      </div>
      <div class="form-group">
        <textarea
          v-model="newSubtask.description"
          class="form-control"
          placeholder="Описание (необязательно)"
          rows="2"
        ></textarea>
      </div>
      <div class="form-actions">
        <button
          class="btn btn-secondary"
          @click="cancelAdd"
          :disabled="addingSubtask"
        >
          Отмена
        </button>
        <button
          class="btn btn-primary"
          @click="addSubtask"
          :disabled="addingSubtask || !canAdd"
        >
          <Icon v-if="addingSubtask" name="mdi:loading" size="16" class="spin" />
          <Icon v-else name="mdi:check" size="16" />
          {{ addingSubtask ? 'Добавление...' : 'Добавить' }}
        </button>
      </div>
    </div>

    <!-- Список подзадач -->
    <div v-if="subtasks && subtasks.length > 0" class="subtasks-list">
      <SubtaskItem
        v-for="subtask in subtasks"
        :key="subtask.id"
        :subtask="subtask"
        :task-id="taskId"
        @updated="$emit('updated')"
        @deleted="$emit('updated')"
      />
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="!showAddForm" class="empty-state">
      <Icon name="mdi:clipboard-list-outline" size="48" />
      <p>Нет подзадач</p>
      <span class="empty-hint">Нажмите "Добавить", чтобы создать первую подзадачу</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useSubtasks } from '~/composables/boards/useSubtasks'
import { useNotifications } from '~/composables/useNotifications'
import SubtaskItem from './SubtaskItem.vue'
import type { Subtask } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  subtasks: Subtask[]
  taskId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

// ============================================
// COMPOSABLES
// ============================================
const { createSubtask } = useSubtasks()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const showAddForm = ref(false)
const addingSubtask = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
const newSubtask = ref({
  title: '',
  description: ''
})

// ============================================
// COMPUTED
// ============================================
const canAdd = computed(() => {
  return newSubtask.value.title.trim().length > 0
})

// ============================================
// METHODS
// ============================================
const startAdd = async () => {
  showAddForm.value = true
  newSubtask.value = { title: '', description: '' }
  
  await nextTick()
  if (titleInputRef.value) {
    titleInputRef.value.focus()
  }
}

const cancelAdd = () => {
  showAddForm.value = false
  newSubtask.value = { title: '', description: '' }
}

const addSubtask = async () => {
  if (!canAdd.value) return
  
  addingSubtask.value = true
  
  try {
    await createSubtask(props.taskId, {
      title: newSubtask.value.title.trim(),
      description: newSubtask.value.description.trim() || undefined,
      parentId: null,
      order: 0
    })
    
    notifications.success('Подзадача добавлена')
    emit('updated')
    cancelAdd()
  } catch (error) {
    console.error('Failed to create subtask:', error)
    notifications.error('Не удалось добавить подзадачу')
  } finally {
    addingSubtask.value = false
  }
}

// ============================================
// EXPOSE
// ============================================
defineExpose({
  startAdd,
  cancelAdd
})

// ============================================
// WATCHERS
// ============================================
watch(() => props.taskId, () => {
  cancelAdd()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.subtasks-tree {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Форма добавления
.subtask-add-form {
  padding: 16px;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid #334155;
}

.form-group {
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-control {
  width: 100%;
  padding: 12px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: $text-light;
  font-size: 14px;
  font-family: inherit;
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

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

// Список подзадач
.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// Пустое состояние
.empty-state {
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
    color: #475569;
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
  .subtask-add-form {
    padding: 12px;
  }
  
  .form-actions {
    flex-direction: column;
    
    .btn {
      width: 100%;
    }
  }
}
</style>