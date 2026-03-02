<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/index.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="isOpen" class="task-details-modal" @click="handleOverlayClick">
        <div class="modal-overlay"></div>
        <div class="modal-content" @click.stop>
          <!-- Шапка -->
          <TaskDetailsHeader
            :task="task"
            :board-id="boardId"
            @close="$emit('close')"
            @status-change="handleStatusChange"
          />
          
          <!-- Тело модалки -->
          <div class="modal-body">
            <div class="task-details-grid">
              <!-- Основной контент -->
              <TaskDetailsMainContent
                :task="task"
                :board-id="boardId"
                @task-updated="$emit('task-updated')"
              />
              
              <!-- Боковая панель -->
              <TaskDetailsSidebar
                :task="task"
                :board-id="boardId"
                @status-change="handleStatusChange"
                @task-deleted="handleDelete"
                @task-updated="$emit('task-updated')"
              />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import TaskDetailsHeader from './Header.vue'
import TaskDetailsMainContent from './MainContent.vue'
import TaskDetailsSidebar from './Sidebar/index.vue'
import type { Task } from '~/types/boards'
import { useTasksStore } from 'stores/boards/tasks'
import { useNotifications } from '~/composables/useNotifications'
import { useTaskModalStore } from 'stores/boards/taskModal'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
}>()

// ✅ ИСПРАВЛЕНО: используем kebab-case для имён событий
const emit = defineEmits<{
  close: []
  'task-updated': []
  'task-deleted': []
}>()

// ============================================
// STORES
// ============================================
const tasksStore = useTasksStore()
const taskModalStore = useTaskModalStore()
const notifications = useNotifications()

// ============================================
// COMPUTED
// ============================================
const isOpen = computed(() => {
  return props.task !== null
})

// ============================================
// METHODS
// ============================================
const handleOverlayClick = () => {
  emit('close')
}

const handleTaskUpdated = async () => {
  try {
    await nextTick() // ✅ Ждём завершения реактивных обновлений
    const updatedTask = tasksStore.tasks.find(t => t.id === props.task.id)
    if (updatedTask && taskModalStore.isOpen) {
      taskModalStore.setTaskData(updatedTask)
      console.log('[TaskDetails] Forced task data refresh after subtask update')
    }
    emit('task-updated')
  } catch (error) {
    console.error('Failed to refresh task:', error)
  }
}

const handleStatusChange = async (status: string) => {
  try {
    await tasksStore.updateTaskOptimistic(props.task.id, {
      status: status as any
    })
    notifications.success(`Статус изменён на "${getStatusLabel(status)}"`)
    await handleTaskUpdated()
  } catch (error) {
    console.error('Failed to update status:', error)
    notifications.error('Не удалось изменить статус')
  }
}

const handleDelete = async () => {
  if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
    try {
      await tasksStore.deleteTask(props.task.id)
      notifications.success('Задача удалена')
      emit('task-deleted')
      emit('close')
    } catch (error) {
      console.error('Failed to delete task:', error)
      notifications.error('Не удалось удалить задачу')
    }
  }
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

watch(
  () => tasksStore.tasks.find(t => t.id === props.task.id),
  (newTask) => {
    if (newTask && taskModalStore.isOpen) {
      taskModalStore.setTaskData(newTask)
    }
  },
  { deep: true }
)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: relative;
  background: #0f172a;
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.task-details-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
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

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
  opacity: 0;
}

// Адаптивность
@media (max-width: 768px) {
  .task-details-modal {
    padding: 10px;
  }
  
  .task-details-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-body {
    padding: 16px;
  }
}
</style>