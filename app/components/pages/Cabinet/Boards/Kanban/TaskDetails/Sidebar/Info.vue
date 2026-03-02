<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sidebar/Info.vue -->
<template>
  <div class="task-sidebar-section task-info-section">
    <h4 class="task-sidebar-title">
      <Icon name="mdi:information-outline" size="18" />
      Информация
    </h4>
    
    <div class="task-info-list">
      <!-- Дата создания -->
      <div class="task-info-item">
        <div class="task-info-label">
          <Icon name="mdi:clock-plus-outline" size="16" />
          <span>Создана</span>
        </div>
        <div class="task-info-value">
          <span class="info-date">{{ formatDate(task.createdAt) }}</span>
          <span class="info-time">{{ formatTime(task.createdAt) }}</span>
        </div>
      </div>
      
      <!-- Дата обновления -->
      <div class="task-info-item">
        <div class="task-info-label">
          <Icon name="mdi:clock-edit-outline" size="16" />
          <span>Обновлена</span>
        </div>
        <div class="task-info-value">
          <span class="info-date">{{ formatDate(task.updatedAt) }}</span>
          <span class="info-time">{{ formatTime(task.updatedAt) }}</span>
        </div>
      </div>
      
      <!-- Срок выполнения -->
      <div 
        class="task-info-item task-info-item--due-date" 
        :class="{ 'is-overdue': isOverdue, 'is-today': isDueToday }"
      >
        <div class="task-info-label">
          <Icon name="mdi:calendar-clock" size="16" />
          <span>Срок выполнения</span>
        </div>
        <div class="task-info-value">
          <span v-if="task.dueDate" class="info-date" :class="{ 'overdue': isOverdue }">
            {{ formatDate(task.dueDate) }}
          </span>
          <span v-else class="info-empty">Не указан</span>
          <span v-if="isOverdue" class="overdue-badge">Просрочено</span>
          <span v-else-if="isDueToday" class="today-badge">Сегодня</span>
        </div>
      </div>
      
      <!-- Дата завершения -->
      <div v-if="task.completedDate" class="task-info-item task-info-item--completed">
        <div class="task-info-label">
          <Icon name="mdi:check-circle-outline" size="16" />
          <span>Завершена</span>
        </div>
        <div class="task-info-value">
          <span class="info-date">{{ formatDate(task.completedDate) }}</span>
          <span class="info-time">{{ formatTime(task.completedDate) }}</span>
        </div>
      </div>
      
      <!-- Исполнитель -->
      <div class="task-info-item task-info-item--assignee">
        <div class="task-info-label">
          <Icon name="mdi:account-outline" size="16" />
          <span>Исполнитель</span>
        </div>
        <div class="task-info-value">
          <div v-if="assignedUser" class="assignee-wrapper">
            <div class="assignee-avatar" :style="{ background: assigneeAvatarColor }">
              {{ getInitials(assignedUser.name) }}
            </div>
            <div class="assignee-info">
              <span class="assignee-name">{{ assignedUser.name }}</span>
              <span v-if="assignedUser.role" class="assignee-role">{{ getRoleLabel(assignedUser.role) }}</span>
            </div>
          </div>
          <span v-else-if="task.assignedTo" class="info-loading">
            <Icon name="mdi:loading" size="14" class="spin" />
          </span>
          <span v-else class="info-empty">Не назначен</span>
        </div>
      </div>
      
      <!-- Создатель задачи -->
      <div class="task-info-item task-info-item--creator">
        <div class="task-info-label">
          <Icon name="mdi:account-plus-outline" size="16" />
          <span>Создатель</span>
        </div>
        <div class="task-info-value">
          <div v-if="creatorUser" class="assignee-wrapper">
            <div class="assignee-avatar" :style="{ background: creatorAvatarColor }">
              {{ getInitials(creatorUser.name) }}
            </div>
            <div class="assignee-info">
              <span class="assignee-name">{{ creatorUser.name }}</span>
              <span v-if="creatorUser.role" class="assignee-role">{{ getRoleLabel(creatorUser.role) }}</span>
            </div>
          </div>
          <span v-else class="info-loading">
            <Icon name="mdi:loading" size="14" class="spin" />
          </span>
        </div>
      </div>
      
      <!-- Приоритет -->
      <div class="task-info-item task-info-item--priority">
        <div class="task-info-label">
          <Icon name="mdi:flag-outline" size="16" />
          <span>Приоритет</span>
        </div>
        <div class="task-info-value">
          <span class="priority-badge" :class="`priority-${task.priority}`">
            <Icon :name="getPriorityIcon(task.priority)" size="14" />
            {{ getPriorityLabel(task.priority) }}
          </span>
        </div>
      </div>
      
      <!-- Статус -->
      <div class="task-info-item task-info-item--status">
        <div class="task-info-label">
          <Icon name="mdi:label-outline" size="16" />
          <span>Статус</span>
        </div>
        <div class="task-info-value">
          <span class="status-badge" :class="`status-${task.status}`">
            <Icon :name="getStatusIcon(task.status)" size="14" />
            {{ getStatusLabel(task.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useUsersStore } from 'stores/users'
import type { Task } from '~/types/boards'

// ============================================
// ✅ ЛОКАЛЬНЫЙ ИНТЕРФЕЙС ДЛЯ ПОЛЬЗОВАТЕЛЯ ИЗ API
// ============================================
interface ApiUser {
  id: number
  login: string
  name: string
  role: 'admin' | 'manager' | 'foreman' | 'master' | 'worker'
  telegramId?: number | null
  createdAt?: string
  updatedAt?: string
}

// ============================================
// PROPS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
}>()

// ============================================
// STORES
// ============================================
const usersStore = useUsersStore()

// ============================================
// STATE
// ============================================
const assignedUser = ref<ApiUser | null>(null)
const creatorUser = ref<ApiUser | null>(null)

// ============================================
// COMPUTED - Сроки
// ============================================
const isOverdue = computed(() => {
  if (!props.task.dueDate) return false
  const dueDate = new Date(props.task.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return dueDate < today && props.task.status !== 'done'
})

const isDueToday = computed(() => {
  if (!props.task.dueDate) return false
  const dueDate = new Date(props.task.dueDate)
  const today = new Date()
  return (
    dueDate.getDate() === today.getDate() &&
    dueDate.getMonth() === today.getMonth() &&
    dueDate.getFullYear() === today.getFullYear()
  )
})

// ============================================
// COMPUTED - Цвета аватаров
// ============================================
const assigneeAvatarColor = computed(() => {
  // ✅ Безопасный доступ к id с fallback
  const userId = assignedUser.value?.id ?? props.task.assignedTo ?? 0
  return getUserAvatarColor(userId)
})

const creatorAvatarColor = computed(() => {
  // ✅ Безопасный доступ к id с fallback
  const userId = creatorUser.value?.id ?? props.task.createdBy ?? 0
  return getUserAvatarColor(userId)
})

// ============================================
// METHODS - Загрузка пользователя
// ============================================
const fetchUser = async (userId: number): Promise<ApiUser | null> => {
  try {
    const user = await $fetch<ApiUser>(`/api/users/${userId}`)
    return user
  } catch (error) {
    console.error(`Failed to fetch user ${userId}:`, error)
    return null
  }
}

// ============================================
// METHODS - Форматирование
// ============================================
const formatDate = (dateString?: string | null) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatTime = (dateString?: string | null) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getInitials = (name?: string) => {
  if (!name || name.trim() === '') return 'U'
  const parts = name.trim().split(' ').filter(part => part.length > 0)
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? ''
    const second = parts[1]?.[0] ?? ''
    return (first + second).toUpperCase()
  }
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return 'U'
}

const getUserAvatarColor = (userId: number) => {
  const colors = [
    '#00c3f5', '#00A12A', '#7c3aed', '#FAB702',
    '#e83e8c', '#17a2b8', '#28a745', '#dc3545'
  ]
  const index = userId % colors.length
  return colors[index]
}

const getRoleLabel = (role?: string) => {
  if (!role) return ''
  const labels: Record<string, string> = {
    admin: 'Админ',
    manager: 'Менеджер',
    foreman: 'Прораб',
    master: 'Мастер',
    worker: 'Рабочий'
  }
  return labels[role] || role
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочно'
  }
  return labels[priority] || priority
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

const getStatusIcon = (status: string) => {
  const icons: Record<string, string> = {
    todo: 'mdi:clipboard-text',
    in_progress: 'mdi:progress-clock',
    review: 'mdi:eye-check',
    done: 'mdi:check-circle',
    blocked: 'mdi:lock',
    cancelled: 'mdi:cancel'
  }
  return icons[status] || 'mdi:circle-outline'
}

// ============================================
// WATCHERS - Загрузка данных пользователей
// ============================================
const loadUsers = async () => {
  // Загружаем исполнителя
  if (props.task.assignedTo && !assignedUser.value) {
    assignedUser.value = await fetchUser(props.task.assignedTo)
  }
  
  // Загружаем создателя
  if (props.task.createdBy && !creatorUser.value) {
    creatorUser.value = await fetchUser(props.task.createdBy)
  }
}

watch(
  () => [props.task.assignedTo, props.task.createdBy],
  () => {
    loadUsers()
  },
  { immediate: true }
)

onMounted(() => {
  loadUsers()
})
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
    color: $blue;
  }
}

.task-info-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #334155;
  gap: 12px;
  
  &:last-child {
    border-bottom: none;
  }
  
  &--due-date {
    .info-date.overdue {
      color: $red;
    }
  }
  
  &--completed {
    .task-info-label {
      color: $green;
    }
  }
}

.task-info-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-size: 13px;
  flex-shrink: 0;
  min-width: 100px;
  
  .icon {
    color: #64748b;
    flex-shrink: 0;
  }
}

.task-info-value {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
  text-align: right;
}

.info-date {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
  
  &.overdue {
    color: $red;
  }
}

.info-time {
  color: #64748b;
  font-size: 12px;
}

.info-empty {
  color: #64748b;
  font-size: 13px;
  font-style: italic;
}

.info-loading {
  display: flex;
  align-items: center;
  color: #64748b;
}

// Бейджи сроков
.overdue-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: rgba($red, 0.15);
  color: $red;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

.today-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: rgba($yellow, 0.15);
  color: $yellow;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

// Исполнитель и создатель
.assignee-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

.assignee-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: $text-light;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
  text-transform: uppercase;
}

.assignee-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.assignee-name {
  color: #cbd5e1;
  font-size: 13px;
  font-weight: 500;
}

.assignee-role {
  color: #64748b;
  font-size: 11px;
}

// Бейджи приоритета и статуса
.priority-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
  color: $text-light;
}

// Приоритеты
.priority-badge {
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
  }
}

// Статусы
.status-badge {
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
  .task-sidebar-section {
    padding: 16px;
  }
  
  .task-info-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .task-info-label {
    min-width: auto;
    width: 100%;
  }
  
  .task-info-value {
    justify-content: flex-start;
    width: 100%;
  }
  
  .assignee-wrapper {
    justify-content: flex-start;
  }
  
  .assignee-info {
    align-items: flex-start;
  }
}
</style>