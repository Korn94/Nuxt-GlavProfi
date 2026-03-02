<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sidebar/index.vue -->
<template>
  <aside class="task-sidebar">
    <!-- Информация о задаче -->
    <TaskDetailsSidebarInfo :task="task" :board-id="boardId" />
    
    <!-- Управление тегами -->
    <TaskDetailsSidebarTags 
      :task="task" 
      :board-id="boardId" 
      @updated="$emit('task-updated')" 
    />
    
    <!-- Вложения -->
    <TaskDetailsSidebarAttachments 
      :task="task" 
      :board-id="boardId" 
      @updated="$emit('task-updated')" 
    />
    
    <!-- Быстрые действия -->
    <TaskDetailsSidebarActions 
      :task="task" 
      :board-id="boardId" 
      @status-change="$emit('status-change', $event)"
      @task-deleted="$emit('task-deleted')"
      @task-updated="$emit('task-updated')"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TaskDetailsSidebarInfo from './Info.vue'
import TaskDetailsSidebarTags from './Tags.vue'
import TaskDetailsSidebarAttachments from './Attachments.vue'
import TaskDetailsSidebarActions from './Actions.vue'
import type { Task } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
}>()

const emit = defineEmits<{
  'status-change': [status: string]
  'task-deleted': []
  'task-updated': []
}>()

// ============================================
// COMPUTED
// ============================================
const hasSidebarContent = computed(() => {
  return props.task !== null
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  max-width: 400px;
}

// Адаптивность
@media (max-width: 768px) {
  .task-sidebar {
    max-width: 100%;
    gap: 16px;
  }
}
</style>