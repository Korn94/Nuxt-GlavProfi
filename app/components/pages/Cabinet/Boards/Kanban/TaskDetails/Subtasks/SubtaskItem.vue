<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Subtasks/SubtaskItem.vue -->
<template>
  <div 
    class="subtask-item" 
    :class="{ 
      'completed': subtask.isCompleted,
      'editing': isEditing,
      'has-children': hasChildren
    }"
  >
    <!-- Основная строка подзадачи -->
    <div class="subtask-row">
      <!-- Чекбокс завершения -->
      <label class="subtask-checkbox">
        <input
          type="checkbox"
          :checked="subtask.isCompleted"
          @change="toggleComplete"
          :disabled="updating"
        />
        <span class="checkmark">
          <Icon name="mdi:check" size="14" />
        </span>
      </label>
      
      <!-- Контент подзадачи -->
      <div class="subtask-content">
        <!-- Режим просмотра -->
        <template v-if="!isEditing">
          <div class="subtask-title-row">
            <span class="subtask-title" :class="{ completed: subtask.isCompleted }">
              {{ subtask.title }}
            </span>
            
            <!-- Кнопки действий -->
            <div class="subtask-actions">
              <button
                class="action-btn"
                @click="startEditing"
                title="Редактировать"
                :disabled="updating"
              >
                <Icon name="mdi:pencil" size="14" />
              </button>
              <button
                v-if="!hasChildren"
                class="action-btn"
                @click="showAddChild = true"
                title="Добавить подзадачу"
                :disabled="updating"
              >
                <Icon name="mdi:plus" size="14" />
              </button>
              <button
                class="action-btn btn-danger"
                @click="handleDelete"
                title="Удалить"
                :disabled="updating"
              >
                <Icon name="mdi:delete" size="14" />
              </button>
            </div>
          </div>
          
          <!-- Описание подзадачи -->
          <p v-if="subtask.description" class="subtask-description">
            {{ subtask.description }}
          </p>
        </template>
        
        <!-- Режим редактирования -->
        <template v-else>
          <div class="subtask-edit-form">
            <input
              ref="titleInputRef"
              v-model="editData.title"
              type="text"
              class="form-control"
              placeholder="Название подзадачи"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
            <textarea
              v-model="editData.description"
              class="form-control textarea"
              placeholder="Описание (необязательно)"
              rows="2"
              @keyup.esc="cancelEdit"
            ></textarea>
            <div class="edit-actions">
              <button
                class="btn btn-sm btn-secondary"
                @click="cancelEdit"
                :disabled="updating"
              >
                Отмена
              </button>
              <button
                class="btn btn-sm btn-primary"
                @click="saveEdit"
                :disabled="updating || !canSave"
              >
                <Icon v-if="updating" name="mdi:loading" size="14" class="spin" />
                <Icon v-else name="mdi:check" size="14" />
                {{ updating ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
    
    <!-- Форма добавления дочерней подзадачи -->
    <Transition name="form-slide">
      <div v-if="showAddChild" class="child-add-form">
        <input
          ref="childTitleInputRef"
          v-model="childData.title"
          type="text"
          class="form-control"
          placeholder="Название подзадачи..."
          @keyup.enter="addChild"
          @keyup.esc="cancelAddChild"
          autofocus
        />
        <div class="child-add-actions">
          <button
            class="btn btn-sm btn-secondary"
            @click="cancelAddChild"
            :disabled="addingChild"
          >
            Отмена
          </button>
          <button
            class="btn btn-sm btn-primary"
            @click="addChild"
            :disabled="addingChild || !canAddChild"
          >
            <Icon v-if="addingChild" name="mdi:loading" size="14" class="spin" />
            <Icon v-else name="mdi:check" size="14" />
            {{ addingChild ? 'Добавление...' : 'Добавить' }}
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Дочерние подзадачи -->
    <div v-if="hasChildren" class="subtask-children">
      <SubtaskItem
        v-for="child in subtask.subtasks"
        :key="child.id"
        :subtask="child"
        :task-id="taskId"
        @updated="$emit('updated')"
        @deleted="$emit('deleted')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useSubtasks } from '~/composables/boards/useSubtasks'
import { useTasksStore } from 'stores/boards/tasks'
import { useNotifications } from '~/composables/useNotifications'
import type { Subtask } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  subtask: Subtask
  taskId: number
}>()

const emit = defineEmits<{
  updated: []
  deleted: []
}>()

// ============================================
// COMPOSABLES
// ============================================
const { updateSubtask, completeSubtask, deleteSubtask, createSubtask } = useSubtasks()
const tasksStore = useTasksStore()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const isEditing = ref(false)
const showAddChild = ref(false)
const updating = ref(false)
const addingChild = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
const childTitleInputRef = ref<HTMLInputElement | null>(null)

const editData = ref({
  title: props.subtask.title,
  description: props.subtask.description || ''
})

const childData = ref({
  title: ''
})

// ============================================
// COMPUTED
// ============================================
const hasChildren = computed(() => {
  return props.subtask.subtasks && props.subtask.subtasks.length > 0
})

const canSave = computed(() => {
  return editData.value.title.trim().length > 0 &&
         editData.value.title.trim() !== props.subtask.title
})

const canAddChild = computed(() => {
  return childData.value.title.trim().length > 0
})

// ============================================
// METHODS - Завершение подзадачи
// ============================================
const toggleComplete = async () => {
  updating.value = true
  
  try {
    await completeSubtask(props.subtask.id, !props.subtask.isCompleted, false)
    notifications.success(props.subtask.isCompleted ? 'Подзадача развернута' : 'Подзадача завершена')
    await refreshTask()
    emit('updated')
  } catch (error) {
    console.error('Failed to toggle subtask:', error)
    notifications.error('Не удалось изменить статус подзадачи')
  } finally {
    updating.value = false
  }
}

// ============================================
// METHODS - Редактирование
// ============================================
const startEditing = async () => {
  editData.value = {
    title: props.subtask.title,
    description: props.subtask.description || ''
  }
  isEditing.value = true
  
  await nextTick()
  if (titleInputRef.value) {
    titleInputRef.value.focus()
    titleInputRef.value.select()
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editData.value = {
    title: props.subtask.title,
    description: props.subtask.description || ''
  }
}

const saveEdit = async () => {
  if (!canSave.value) {
    cancelEdit()
    return
  }
  
  updating.value = true
  
  try {
    await updateSubtask(props.subtask.id, {
      title: editData.value.title.trim(),
      description: editData.value.description.trim() || undefined
    })
    
    notifications.success('Подзадача обновлена')
    await refreshTask()
    emit('updated')
    cancelEdit()
  } catch (error) {
    console.error('Failed to update subtask:', error)
    notifications.error('Не удалось сохранить подзадачу')
  } finally {
    updating.value = false
  }
}

// ============================================
// METHODS - Дочерние подзадачи
// ============================================
const addChild = async () => {
  if (!canAddChild.value) return
  
  addingChild.value = true
  
  try {
    await createSubtask(props.taskId, {
      title: childData.value.title.trim(),
      description: '',
      parentId: props.subtask.id,
      order: 0
    })
    
    notifications.success('Подзадача добавлена')
    await refreshTask()
    emit('updated')
    cancelAddChild()
  } catch (error) {
    console.error('Failed to create child subtask:', error)
    notifications.error('Не удалось добавить подзадачу')
  } finally {
    addingChild.value = false
  }
}

const cancelAddChild = () => {
  showAddChild.value = false
  childData.value = { title: '' }
}

// ============================================
// METHODS - Удаление
// ============================================
const handleDelete = async () => {
  if (confirm('Удалить эту подзадачу?')) {
    updating.value = true
    
    try {
      await deleteSubtask(props.subtask.id)
      notifications.success('Подзадача удалена')
      await refreshTask()
      emit('deleted')
    } catch (error) {
      console.error('Failed to delete subtask:', error)
      notifications.error('Не удалось удалить подзадачу')
    } finally {
      updating.value = false
    }
  }
}

const refreshTask = async () => {
  try {
    // Запускаем событие для обновления в родителе
    emit('updated')
  } catch (error) {
    console.error('Failed to refresh task:', error)
  }
}

// ============================================
// WATCHERS
// ============================================
watch(() => props.subtask.title, (newTitle) => {
  if (!isEditing.value) {
    editData.value.title = newTitle
  }
})

watch(() => props.subtask.description, (newDesc) => {
  if (!isEditing.value) {
    editData.value.description = newDesc || ''
  }
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.subtask-item {
  position: relative;
  padding: 12px 0;
  border-bottom: 1px solid #334155;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.completed {
    .subtask-title {
      color: #64748b;
      text-decoration: line-through;
    }
    
    .subtask-description {
      color: #475569;
    }
  }
}

.subtask-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

// Чекбокс
.subtask-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
  
  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    width: 0;
    height: 0;
    
    &:checked ~ .checkmark {
      background: $green;
      border-color: $green;
      
      .icon {
        display: block;
      }
    }
    
    &:disabled ~ .checkmark {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .checkmark {
    position: relative;
    width: 20px;
    height: 20px;
    background: #1e293b;
    border: 2px solid #475569;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    .icon {
      display: none;
      color: $text-light;
    }
    
    &:hover {
      border-color: $blue;
    }
  }
}

// Контент
.subtask-content {
  flex: 1;
  min-width: 0;
}

.subtask-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}

.subtask-title {
  font-size: 14px;
  font-weight: 500;
  color: $text-light;
  line-height: 1.5;
  word-break: break-word;
  transition: all 0.2s ease;
  
  &.completed {
    color: #64748b;
    text-decoration: line-through;
  }
}

.subtask-description {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
}

// Кнопки действий
.subtask-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .subtask-item:hover & {
    opacity: 1;
  }
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #334155;
    color: $text-light;
  }
  
  &.btn-danger {
    &:hover:not(:disabled) {
      background: rgba($red, 0.15);
      color: $red;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Форма редактирования
.subtask-edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #0f172a;
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
  
  &.textarea {
    resize: vertical;
    min-height: 60px;
  }
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #334155;
}

// Форма добавления дочерней подзадачи
.child-add-form {
  margin-top: 12px;
  padding: 12px;
  background: rgba($blue, 0.05);
  border: 1px solid rgba($blue, 0.2);
  border-radius: 8px;
}

.child-add-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #334155;
}

// Дочерние подзадачи
.subtask-children {
  margin-top: 12px;
  padding-left: 32px;
  border-left: 2px solid #334155;
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
  font-size: 13px;
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
  font-size: 12px;
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
.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.2s ease;
}

.form-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.form-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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
  .subtask-actions {
    opacity: 1;
  }
  
  .subtask-children {
    padding-left: 20px;
  }
}
</style>