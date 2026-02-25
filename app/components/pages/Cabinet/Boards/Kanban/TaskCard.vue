<!-- app/components/pages/cabinet/Boards/Kanban/TaskCard.vue -->
<template>
<div
  ref="taskCardRef"
  class="task-card"
  :class="{ 'dragging': isDragging, 'dropped': isDropped }"
  draggable="true"
  @dragstart="handleDragStart"
  @dragend="handleDragEnd"
  @click="openTaskDetails"
  :style="cardStyle"
>
  <!-- Приоритет и статус -->
  <div class="task-card-header">
    <span class="task-priority" :class="`priority-${task.priority}`">
      {{ getPriorityLabel(task.priority) }}
    </span>
    <span class="task-status" :class="`status-${task.status}`">
      {{ getStatusLabel(task.status) }}
    </span>
  </div>

  <!-- Основное содержимое -->
  <div class="task-card-body">
    <h3 class="task-card-title">{{ task.title }}</h3>
    
    <p v-if="task.description" class="task-card-description">
      {{ truncateText(task.description, 80) }}
    </p>

    <!-- Теги -->
    <div v-if="task.tags && task.tags.length > 0" class="task-card-tags">
      <span
        v-for="tag in task.tags"
        :key="tag.id"
        class="task-card-tag"
        :style="{ backgroundColor: tag.color }"
      >
        {{ tag.name }}
      </span>
    </div>
  </div>

  <!-- Футер с мета-данными -->
  <div class="task-card-footer">
    <div class="task-card-meta">
      <span v-if="task.dueDate" class="task-card-meta-item">
        <Icon name="mdi:calendar" size="14" />
        {{ formatDate(task.dueDate) }}
      </span>
      
      <span v-if="task.assignedTo" class="task-card-meta-item">
        <Icon name="mdi:account" size="14" />
        Исполнитель
      </span>
    </div>

    <div class="task-card-stats">
      <span v-if="task.subtasks" class="task-card-subtasks">
        <Icon name="mdi:checkbox-marked-circle" size="14" />
        {{ getCompletedSubtasks(task.subtasks) }}/{{ task.subtasks.length }}
      </span>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTaskModalStore } from 'stores/boards/taskModal'
import { useTasksStore } from 'stores/boards/tasks'
import type { Task } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
}>()

const emit = defineEmits<{
  moveTask: [taskId: number, newStatus: string]
}>()

// ============================================
// STORES
// ============================================
const taskModalStore = useTaskModalStore()
const taskStore = useTasksStore()

// ============================================
// STATE
// ============================================
const taskCardRef = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const isDropped = ref(false)
const initialPosition = ref({ x: 0, y: 0 })
const dragStartPosition = ref({ x: 0, y: 0 })
const animationFrame = ref<number | null>(null)

// ============================================
// COMPUTED - Стили с анимацией
// ============================================
const cardStyle = computed(() => {
  const baseStyle: Record<string, string | number> = {
    cursor: isDragging.value ? 'grabbing' : 'grab'
  }
  
  if (isDragging.value) {
    baseStyle.opacity = '0.8'
    baseStyle.transform = 'scale(1.05)'
    baseStyle.zIndex = '100'
  }
  
  if (isDropped.value) {
    baseStyle.animation = 'drop-animation 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
  
  return baseStyle
})

// ============================================
// NATIVE DRAG & DROP
// ============================================
const handleDragStart = (event: DragEvent) => {
  if (!props.boardId || !taskCardRef.value) return
  
  // Сохраняем данные задачи в dataTransfer
  const dragData = {
    type: 'task',
    taskId: props.task.id,
    boardId: props.boardId,
    status: props.task.status,
    order: props.task.order
  }
  
  event.dataTransfer!.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer!.effectAllowed = 'move'
  
  // Сохраняем начальную позицию для анимации
  const rect = taskCardRef.value.getBoundingClientRect()
  initialPosition.value = { x: rect.left, y: rect.top }
  dragStartPosition.value = { x: event.clientX, y: event.clientY }
  
  // Визуальная обратная связь
  isDragging.value = true
  
  // Добавляем тень для лучшей видимости
  if (taskCardRef.value) {
    taskCardRef.value.style.boxShadow = `0 8px 24px rgba(0, 195, 245, 0.4)`
  }
}

const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false
  
  // Восстанавливаем стили
  if (taskCardRef.value) {
    taskCardRef.value.style.opacity = '1'
    taskCardRef.value.style.transform = 'scale(1)'
    taskCardRef.value.style.boxShadow = ''
    taskCardRef.value.style.zIndex = '1'
  }
  
  // Запускаем анимацию "приземления" если задача была перемещена
  setTimeout(() => {
    isDropped.value = true
    setTimeout(() => {
      isDropped.value = false
    }, 400)
  }, 50)
}

// ============================================
// COMPUTED - Метки для приоритета и статуса
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
    month: 'short'
  })
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getCompletedSubtasks = (subtasks: any[]): number => {
  if (!subtasks || subtasks.length === 0) return 0
  
  let count = 0
  const countCompleted = (subs: any[]) => {
    subs.forEach(sub => {
      if (sub.isCompleted) count++
      if (sub.subtasks && sub.subtasks.length > 0) {
        countCompleted(sub.subtasks)
      }
    })
  }
  
  countCompleted(subtasks)
  return count
}

// ============================================
// METHODS
// ============================================
const openTaskDetails = () => {
  taskModalStore.open(props.task.id, null, props.task.id)
  
  // Принудительно обновляем данные из стора
  const fullTask = taskStore.tasks.find((t: { id: number; }) => t.id === props.task.id)
  if (fullTask) {
    taskModalStore.setTaskData(fullTask)
  }
}
</script>

<style scoped lang="scss">
// Импорт переменных напрямую для надежности
@use '@/assets/styles/_variables.scss' as *;

.task-card {
  background: $background-gray;
  border: 1px solid $text-dark;
  border-radius: 8px;
  padding: 16px;
  cursor: grab;
  user-select: none;
  position: relative;
  z-index: 1;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    border-color: $blue;
  }
  
  &.dragging {
    cursor: grabbing;
    z-index: 100;
    box-shadow: 0 8px 24px rgba($blue, 0.4);
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba($blue, 0.6);
    }
  }
  
  &.dropped {
    animation: drop-animation 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

@keyframes drop-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.95) translateY(-4px);
  }
  70% {
    transform: scale(1.02) translateY(2px);
  }
  100% {
    transform: scale(1) translateY(0);
  }
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #374151;
}

.task-priority {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
  color: $text-light;
}

.task-priority.priority-low {
  background: #374151;
}

.task-priority.priority-medium {
  background: rgba($blue, 0.2);
  color: $blue;
}

.task-priority.priority-high {
  background: rgba(124, 58, 237, 0.2);
  color: #7c3aed;
}

.task-priority.priority-urgent {
  background: rgba($red, 0.2);
  color: $red;
}

.task-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  font-size: 11px;
  border-radius: 4px;
  text-transform: uppercase;
  color: $text-light;
}

.task-status.status-todo {
  background: #374151;
  color: $yellow;
}

.task-status.status-in_progress {
  background: rgba($blue, 0.2);
  color: $blue;
}

.task-status.status-review {
  background: rgba(124, 58, 237, 0.2);
  color: #7c3aed;
}

.task-status.status-done {
  background: rgba($green, 0.2);
  color: $green;
}

.task-status.status-blocked {
  background: rgba($red, 0.2);
  color: $red;
}

.task-status.status-cancelled {
  background: #6b7280;
}

.task-card-body {
  margin-bottom: 12px;
}

.task-card-title {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 600;
  color: $text-light;
  line-height: 1.4;
}

.task-card-description {
  margin: 0;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.5;
}

.task-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.task-card-tag {
  display: inline-block;
  padding: 3px 8px;
  font-size: 11px;
  color: $text-light;
  border-radius: 3px;
  font-weight: 500;
}

.task-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #374151;
}

.task-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 12px;
}

.task-card-meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .icon {
    color: #6b7280;
  }
}

.task-card-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9ca3af;
  font-size: 12px;
}

.task-card-subtasks {
  display: flex;
  align-items: center;
  gap: 4px;
  
  .icon {
    color: $blue;
  }
}
</style>