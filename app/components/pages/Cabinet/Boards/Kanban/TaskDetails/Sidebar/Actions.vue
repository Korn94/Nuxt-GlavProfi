<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sidebar/Actions.vue -->
<template>
  <div class="task-sidebar-section task-actions-section">
    <h4 class="task-sidebar-title">
      <Icon name="mdi:lightning-bolt-outline" size="18" />
      Быстрые действия
    </h4>
    
    <!-- Кнопки изменения статуса -->
    <div class="status-actions">
      <button
        v-for="action in statusActions"
        :key="action.value"
        class="status-action-btn"
        :class="[
          `status-${action.value}`,
          { active: task.status === action.value }
        ]"
        @click="handleStatusChange(action.value)"
        :disabled="updating"
      >
        <Icon :name="action.icon" size="18" />
        <span>{{ action.label }}</span>
      </button>
    </div>
    
    <!-- Разделитель -->
    <div class="actions-divider"></div>
    
    <!-- Основные действия -->
    <div class="main-actions">
      <button
        class="action-btn action-btn--block"
        :disabled="updating || task.status === 'blocked'"
        @click="handleStatusChange('blocked')"
      >
        <Icon name="mdi:lock" size="18" />
        <span>{{ task.status === 'blocked' ? 'Заблокировано' : 'Заблокировать' }}</span>
      </button>
      
      <button
        class="action-btn action-btn--complete"
        :disabled="updating || task.status === 'done'"
        @click="handleStatusChange('done')"
      >
        <Icon name="mdi:check-circle" size="18" />
        <span>{{ task.status === 'done' ? 'Завершено' : 'Завершить задачу' }}</span>
      </button>
    </div>
    
    <!-- Разделитель -->
    <div class="actions-divider"></div>
    
    <!-- Опасные действия -->
    <div class="danger-actions">
      <button
        class="action-btn action-btn--danger"
        @click="confirmDelete"
        :disabled="deleting"
      >
        <Icon v-if="deleting" name="mdi:loading" size="18" class="spin" />
        <Icon v-else name="mdi:delete" size="18" />
        <span>{{ deleting ? 'Удаление...' : 'Удалить задачу' }}</span>
      </button>
    </div>
    
    <!-- Модалка подтверждения удаления -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
          <div class="modal modal-sm" @click.stop>
            <div class="modal-header">
              <h3>
                <Icon name="mdi:alert-circle" size="24" class="warning-icon" />
                Удаление задачи
              </h3>
              <button class="modal-close" @click="cancelDelete">
                <Icon name="mdi:close" size="24" />
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-warning">
                Вы уверены, что хотите удалить задачу
                <strong>"{{ truncateText(task.title, 50) }}"</strong>?
              </p>
              <div class="delete-info-box">
                <Icon name="mdi:information" size="20" class="info-icon" />
                <p class="delete-info">
                  Это действие нельзя отменить. Все подзадачи, комментарии и вложения будут удалены.
                </p>
              </div>
            </div>
            <div class="modal-actions">
              <button
                class="btn btn-secondary"
                @click="cancelDelete"
                :disabled="deleting"
              >
                Отмена
              </button>
              <button
                class="btn btn-danger"
                @click="deleteTask"
                :disabled="deleting"
              >
                <Icon v-if="deleting" name="mdi:loading" size="16" class="spin" />
                {{ deleting ? 'Удаление...' : 'Удалить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
  statusChange: [status: string]
  taskDeleted: []
  taskUpdated: []
}>()

// ============================================
// STORES
// ============================================
const tasksStore = useTasksStore()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const updating = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)

// ============================================
// STATUS ACTIONS CONFIG
// ============================================
const statusActions = [
  {
    value: 'todo',
    label: 'В ожидании',
    icon: 'mdi:clipboard-text'
  },
  {
    value: 'in_progress',
    label: 'В работе',
    icon: 'mdi:progress-clock'
  },
  {
    value: 'review',
    label: 'На проверке',
    icon: 'mdi:eye-check'
  },
  {
    value: 'cancelled',
    label: 'Отменено',
    icon: 'mdi:cancel'
  }
]

// ============================================
// METHODS - Изменение статуса
// ============================================
const handleStatusChange = async (status: string) => {
  if (status === props.task.status) return
  
  updating.value = true
  
  try {
    await tasksStore.updateTaskOptimistic(props.task.id, {
      status: status as any
    })
    
    const statusLabels: Record<string, string> = {
      todo: 'В ожидании',
      in_progress: 'В работе',
      review: 'На проверке',
      done: 'Завершено',
      blocked: 'Заблокировано',
      cancelled: 'Отменено'
    }
    
    notifications.success(`Статус изменён на "${statusLabels[status]}"`)
    emit('statusChange', status)
    emit('taskUpdated')
  } catch (error) {
    console.error('Failed to update status:', error)
    notifications.error('Не удалось изменить статус задачи')
  } finally {
    updating.value = false
  }
}

// ============================================
// METHODS - Удаление задачи
// ============================================
const confirmDelete = () => {
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}

const deleteTask = async () => {
  deleting.value = true
  
  try {
    await tasksStore.deleteTask(props.task.id)
    notifications.success('Задача удалена')
    emit('taskDeleted')
    cancelDelete()
  } catch (error) {
    console.error('Failed to delete task:', error)
    notifications.error('Не удалось удалить задачу')
  } finally {
    deleting.value = false
  }
}

// ============================================
// UTILS
// ============================================
const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-sidebar-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.task-sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: $text-light;
  
  .icon {
    color: $yellow;
  }
}

// Кнопки статусов
.status-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}

.status-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  .icon {
    flex-shrink: 0;
  }
  
  span {
    text-align: center;
    line-height: 1.3;
  }
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  // Стили для каждого статуса
  &.status-todo {
    &:hover:not(:disabled),
    &.active {
      background: #374151;
      border-color: $yellow;
      color: $yellow;
    }
  }
  
  &.status-in_progress {
    &:hover:not(:disabled),
    &.active {
      background: rgba($blue, 0.15);
      border-color: $blue;
      color: $blue;
    }
  }
  
  &.status-review {
    &:hover:not(:disabled),
    &.active {
      background: rgba(124, 58, 237, 0.15);
      border-color: #7c3aed;
      color: #7c3aed;
    }
  }
  
  &.status-done {
    &:hover:not(:disabled),
    &.active {
      background: rgba($green, 0.15);
      border-color: $green;
      color: $green;
    }
  }
  
  &.status-blocked {
    &:hover:not(:disabled),
    &.active {
      background: rgba($red, 0.15);
      border-color: $red;
      color: $red;
    }
  }
  
  &.status-cancelled {
    &:hover:not(:disabled),
    &.active {
      background: #4b5563;
      border-color: #6b7280;
      color: #9ca3af;
    }
  }
}

// Разделитель
.actions-divider {
  height: 1px;
  background: #334155;
  margin: 16px 0;
}

// Основные действия
.main-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  .icon {
    flex-shrink: 0;
  }
  
  span {
    color: unset;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &--block {
    background: rgba($red, 0.1);
    border: 1px solid rgba($red, 0.3);
    color: $red;
    
    &:hover:not(:disabled) {
      background: rgba($red, 0.2);
      border-color: rgba($red, 0.5);
    }
    
    &.active {
      background: rgba($red, 0.2);
      border-color: $red;
    }
  }
  
  &--complete {
    background: rgba($green, 0.1);
    border: 1px solid rgba($green, 0.3);
    color: $green;
    
    &:hover:not(:disabled) {
      background: rgba($green, 0.2);
      border-color: rgba($green, 0.5);
    }
    
    &.active {
      background: rgba($green, 0.2);
      border-color: $green;
    }
  }
  
  &--danger {
    background: rgba($red, 0.1);
    border: 1px solid rgba($red, 0.3);
    color: $red;
    width: 100%;
    
    &:hover:not(:disabled) {
      background: rgba($red, 0.2);
      border-color: rgba($red, 0.5);
    }
  }
}

// Опасные действия
.danger-actions {
  margin-top: 8px;
}

// Модалка подтверждения
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
  
  &.modal-sm {
    max-width: 380px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #334155;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $text-light;
    
    .warning-icon {
      color: $red;
    }
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

.delete-warning {
  margin: 0 0 16px 0;
  color: $text-light;
  font-size: 15px;
  line-height: 1.5;
  
  strong {
    color: $blue;
  }
}

.delete-info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba($yellow, 0.1);
  border: 1px solid rgba($yellow, 0.3);
  border-radius: 8px;
  
  .info-icon {
    color: $yellow;
    flex-shrink: 0;
    margin-top: 2px;
  }
}

.delete-info {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #334155;
}

// Кнопки
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: #475569;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #64748b;
  }
}

.btn-danger {
  background: rgba($red, 0.15);
  color: $red;
  border: 1px solid rgba($red, 0.3);
  
  &:hover:not(:disabled) {
    background: rgba($red, 0.25);
    border-color: rgba($red, 0.5);
  }
}

// Анимации
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
  
  .status-actions {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .status-action-btn {
    padding: 10px 6px;
    font-size: 11px;
  }
  
  .action-btn {
    padding: 10px 14px;
    font-size: 13px;
  }
}
</style>