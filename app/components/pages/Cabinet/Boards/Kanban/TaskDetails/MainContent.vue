<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/MainContent.vue -->
<template>
  <div class="task-main-content">
    <!-- Секция описания -->
    <TaskDetailsSectionDescription
      :task="task"
      :board-id="boardId"
      @task-updated="$emit('task-updated')"
    />
    
    <!-- Секция подзадач -->
    <TaskDetailsSectionSubtasks
      :task="task"
      :board-id="boardId"
      @task-updated="$emit('task-updated')"
    />
    
    <!-- Секция комментариев -->
    <TaskDetailsSectionComments
      :task="task"
      :board-id="boardId"
      @task-updated="$emit('task-updated')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TaskDetailsSectionDescription from './Sections/Description.vue'
import TaskDetailsSectionSubtasks from './Sections/Subtasks.vue'
import TaskDetailsSectionComments from './Sections/Comments.vue'
import type { Task } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
}>()

const emit = defineEmits<{
  'task-updated': []
}>()

// ============================================
// COMPUTED
// ============================================
const hasContent = computed(() => {
  return (
    props.task.description ||
    props.task.subtasks?.length ||
    props.task.comments?.length
  )
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;
}

// Адаптивность
@media (max-width: 768px) {
  .task-main-content {
    gap: 16px;
  }
}
</style>