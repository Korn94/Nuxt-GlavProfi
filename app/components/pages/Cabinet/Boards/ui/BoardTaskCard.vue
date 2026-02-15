<!-- app/components/pages/cabinet/Boards/ui/BoardTaskCard.vue -->
<template>
  <div 
    ref="taskCardRef"
    class="board-task-card" 
    :class="{ 'dragging': isDragging, 'dropped': isDropped }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="openTaskDetails"
    :style="cardStyle"
  >
    <div class="board-task-card-header">
      <div class="board-task-card-priority" :class="`priority-${task.priority}`">
        {{ getPriorityLabel(task.priority) }}
      </div>
      <div class="board-task-card-status" :class="`status-${task.status}`">
        {{ getStatusLabel(task.status) }}
      </div>
    </div>

    <div class="board-task-card-body">
      <h3 class="board-task-card-title">{{ task.title }}</h3>
      
      <p v-if="task.description" class="board-task-card-description">
        {{ truncateText(task.description, 80) }}
      </p>

      <div v-if="task.tags && task.tags.length > 0" class="board-task-card-tags">
        <span
          v-for="tag in task.tags"
          :key="tag.id"
          class="board-task-card-tag"
          :style="{ backgroundColor: tag.color }"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>

    <div class="board-task-card-footer">
      <div class="board-task-card-meta">
        <span v-if="task.dueDate" class="board-task-card-due-date">
          📅 {{ formatDate(task.dueDate) }}
        </span>
        <span v-if="task.assignedTo" class="board-task-card-assignee">
          👤 Исполнитель
        </span>
      </div>

      <div class="board-task-card-stats">
        <span v-if="task.subtasks" class="board-task-card-subtasks">
          ✅ {{ getCompletedSubtasks(task.subtasks) }}/{{ task.subtasks.length }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useTaskModalStore } from '../../../../../../stores/boards/taskModal'
import { useTasksStore } from '../../../../../../stores/boards/tasks'
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
    taskCardRef.value.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)'
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
  const fullTask = taskStore.tasks.find(t => t.id === props.task.id)
  if (fullTask) {
    taskModalStore.setTaskData(fullTask)
  }
}
</script>

<style scoped lang="scss">
.board-task-card {
  background: #111827;
  border: 1px solid #374151;
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
    border-color: #3b82f6;
  }
  
  &.dragging {
    cursor: grabbing;
    z-index: 100;
    box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 32px rgba(59, 130, 246, 0.6);
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

.board-task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #374151;
}

.board-task-card-priority {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

.board-task-card-priority.priority-low {
  background: #374151;
  color: #9ca3af;
}

.board-task-card-priority.priority-medium {
  background: #1e3a8a;
  color: #93c5fd;
}

.board-task-card-priority.priority-high {
  background: #8b5cf6;
  color: #ddd6fe;
}

.board-task-card-priority.priority-urgent {
  background: #dc2626;
  color: #fee2e2;
}

.board-task-card-status {
  display: inline-block;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 4px;
  text-transform: uppercase;
}

.board-task-card-status.status-todo {
  background: #374151;
  color: #9ca3af;
}

.board-task-card-status.status-in_progress {
  background: #1e3a8a;
  color: #93c5fd;
}

.board-task-card-status.status-review {
  background: #8b5cf6;
  color: #ddd6fe;
}

.board-task-card-status.status-done {
  background: #059669;
  color: #dcfce7;
}

.board-task-card-status.status-blocked {
  background: #dc2626;
  color: #fee2e2;
}

.board-task-card-status.status-cancelled {
  background: #6b7280;
  color: #f3f4f6;
}

.board-task-card-body {
  margin-bottom: 12px;
}

.board-task-card-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
}

.board-task-card-description {
  margin: 0;
  color: #9ca3af;
  font-size: 14px;
  line-height: 1.5;
}

.board-task-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.board-task-card-tag {
  display: inline-block;
  padding: 3px 8px;
  font-size: 11px;
  color: #fff;
  border-radius: 3px;
  font-weight: 500;
}

.board-task-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #374151;
}

.board-task-card-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #6b7280;
  font-size: 13px;
}

.board-task-card-due-date,
.board-task-card-assignee {
  display: flex;
  align-items: center;
  gap: 4px;
}

.board-task-card-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #9ca3af;
  font-size: 13px;
}

.board-task-card-subtasks {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>