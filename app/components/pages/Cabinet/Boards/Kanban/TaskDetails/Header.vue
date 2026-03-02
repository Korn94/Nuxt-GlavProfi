<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Header.vue -->
<template>
  <div class="task-details-header">
    <div class="header-top-row">
      <!-- Бейджи приоритета и статуса -->
      <div class="task-badges">
        <span 
          class="badge badge-priority" 
          :class="`priority-${task.priority}`"
          :title="getPriorityTooltip(task.priority)"
        >
          <Icon :name="getPriorityIcon(task.priority)" size="14" />
          {{ getPriorityLabel(task.priority) }}
        </span>
        
        <select 
          v-model="selectedStatus" 
          class="badge badge-status status-select"
          :class="`status-${task.status}`"
          @change="handleStatusChange"
        >
          <option 
            v-for="statusOption in statusOptions" 
            :key="statusOption.value"
            :value="statusOption.value"
          >
            {{ statusOption.label }}
          </option>
        </select>
      </div>
      
      <!-- Кнопка закрытия -->
      <button 
        class="close-btn" 
        @click="$emit('close')"
        aria-label="Закрыть"
      >
        <Icon name="mdi:close" size="24" />
      </button>
    </div>
    
    <!-- Заголовок задачи -->
    <h1 class="task-title">{{ task.title }}</h1>
    
    <!-- Мета-информация (опционально) -->
    <div v-if="showMeta" class="header-meta">
      <span v-if="task.dueDate" class="meta-item" :class="{ overdue: isOverdue }">
        <Icon name="mdi:calendar-clock" size="14" />
        {{ formatDate(task.dueDate) }}
        <span v-if="isOverdue" class="overdue-label">(Просрочено)</span>
      </span>
      <span v-if="task.createdBy" class="meta-item">
        <Icon name="mdi:account-plus" size="14" />
        {{ formatDate(task.createdAt) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Task } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
  showMeta?: boolean
}>()

const emit = defineEmits<{
  close: []
  statusChange: [status: string]
}>()

// ============================================
// STATE
// ============================================
const selectedStatus = ref(props.task.status)

// ============================================
// COMPUTED
// ============================================
const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  const dueDate = new Date(props.task.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueDate < today && props.task.status !== 'done'
})

const statusOptions = [
  { value: 'todo', label: 'В ожидании', icon: 'mdi:clipboard-text' },
  { value: 'in_progress', label: 'В работе', icon: 'mdi:progress-clock' },
  { value: 'review', label: 'На проверке', icon: 'mdi:eye-check' },
  { value: 'done', label: 'Завершено', icon: 'mdi:check-circle' },
  { value: 'blocked', label: 'Заблокировано', icon: 'mdi:lock' },
  { value: 'cancelled', label: 'Отменено', icon: 'mdi:cancel' }
]

// ============================================
// METHODS
// ============================================
const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочно'
  }
  return labels[priority] || priority
}

const getPriorityTooltip = (priority: string) => {
  const tooltips: Record<string, string> = {
    low: 'Низкий приоритет - можно выполнить позже',
    medium: 'Средний приоритет - стандартная задача',
    high: 'Высокий приоритет - важно выполнить скоро',
    urgent: 'Срочно - требует немедленного внимания'
  }
  return tooltips[priority] || ''
}

const getPriorityIcon = (priority: string) => {
  const icons: Record<string, string> = {
    low: 'mdi:arrow-down',
    medium: 'mdi:minus',
    high: 'mdi:arrow-up',
    urgent: 'mdi:alert'
  }
  return icons[priority] || 'mdi:minus'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    todo: 'В ожидании',
    in_progress: 'В работе',
    review: 'На проверке',
    done: 'Завершено',
    blocked: 'Заблокировано',
    cancelled: 'Отменено'
  }
  return labels[status] || status
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const handleStatusChange = () => {
  emit('statusChange', selectedStatus.value)
}

// ============================================
// WATCHERS
// ============================================
watch(() => props.task.status, (newStatus) => {
  selectedStatus.value = newStatus
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-details-header {
  background: #1e293b;
  padding: 24px;
  border-bottom: 1px solid #334155;
  border-radius: 16px 16px 0 0;
}

.header-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-badges {
  display: flex;
  gap: 10px;
  align-items: center;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

// Приоритеты
.badge-priority {
  color: $text-light;
  
  &.priority-low {
    background: #374151;
    color: #9ca3af;
  }
  
  &.priority-medium {
    background: rgba($blue, 0.15);
    color: $blue;
    border: 1px solid rgba($blue, 0.3);
  }
  
  &.priority-high {
    background: rgba(124, 58, 237, 0.15);
    color: #7c3aed;
    border: 1px solid rgba(124, 58, 237, 0.3);
  }
  
  &.priority-urgent {
    background: rgba($red, 0.15);
    color: $red;
    border: 1px solid rgba($red, 0.3);
    animation: pulse-urgent 2s infinite;
  }
}

@keyframes pulse-urgent {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba($red, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba($red, 0);
  }
}

// Статусы
.badge-status {
  color: $text-light;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: none;
  padding-right: 24px;
  position: relative;
  
  &::after {
    content: '▼';
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 8px;
    pointer-events: none;
    opacity: 0.7;
  }
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &.status-todo {
    background: #374151;
    color: $yellow;
  }
  
  &.status-in_progress {
    background: rgba($blue, 0.15);
    color: $blue;
    border: 1px solid rgba($blue, 0.3);
  }
  
  &.status-review {
    background: rgba(124, 58, 237, 0.15);
    color: #7c3aed;
    border: 1px solid rgba(124, 58, 237, 0.3);
  }
  
  &.status-done {
    background: rgba($green, 0.15);
    color: $green;
    border: 1px solid rgba($green, 0.3);
  }
  
  &.status-blocked {
    background: rgba($red, 0.15);
    color: $red;
    border: 1px solid rgba($red, 0.3);
  }
  
  &.status-cancelled {
    background: #4b5563;
    color: #9ca3af;
  }
}

.close-btn {
  background: rgba(255, 255, 255, 0.05);
  border: none;
  color: #94a3b8;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text-light;
    transform: rotate(90deg);
  }
}

.task-title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: $text-light;
  line-height: 1.3;
  word-break: break-word;
}

.header-meta {
  display: flex;
  gap: 20px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #334155;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  
  .icon {
    color: #64748b;
  }
  
  &.overdue {
    color: $red;
    
    .overdue-label {
      color: $red;
      font-weight: 600;
      margin-left: 4px;
    }
  }
}

// Адаптивность
@media (max-width: 768px) {
  .task-details-header {
    padding: 16px;
  }
  
  .task-title {
    font-size: 20px;
  }
  
  .header-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .badge {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>