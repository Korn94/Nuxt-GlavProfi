<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sections/Comments.vue -->
<template>
  <div class="task-section comments-section">
    <div class="section-header">
      <h3 class="section-title">
        <Icon name="mdi:message-text-outline" size="20" />
        Комментарии
        <span class="section-count">
          {{ totalCount }}
        </span>
      </h3>
    </div>
    
    <!-- Список комментариев -->
    <div v-if="task.comments && task.comments.length > 0" class="comments-list">
      <CommentItem
        v-for="comment in task.comments"
        :key="comment.id"
        :comment="comment"
        :task-id="task.id"
        @updated="$emit('updated')"
        @deleted="$emit('updated')"
      />
    </div>
    
    <!-- Пустое состояние -->
    <div v-else class="empty-state">
      <Icon name="mdi:message-reply-text-outline" size="48" />
      <p>Нет комментариев</p>
      <span class="empty-hint">Будьте первым, кто оставит комментарий</span>
    </div>
    
    <!-- Форма добавления комментария -->
    <CommentForm
      :task-id="task.id"
      :parent-id="null"
      @added="$emit('updated')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CommentItem from '../Comments/Comment.vue'
import CommentForm from '../Comments/Form.vue'
import type { Task, Comment } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  task: Task
  boardId?: number
}>()

const emit = defineEmits<{
  updated: []
}>()

// ============================================
// COMPUTED
// ============================================
const totalCount = computed(() => {
  if (!props.task.comments) return 0
  return countAllComments(props.task.comments)
})

// ============================================
// METHODS - Подсчёт комментариев
// ============================================
const countAllComments = (comments: Comment[]): number => {
  let count = 0
  comments.forEach(comment => {
    count++
    if (comment.replies && comment.replies.length > 0) {
      count += countAllComments(comment.replies)
    }
  })
  return count
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: $text-light;
  
  .icon {
    color: $blue;
  }
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 24px;
  padding: 0 10px;
  background: #334155;
  color: #94a3b8;
  font-size: 12px;
  border-radius: 12px;
  font-weight: 600;
  margin-left: 8px;
}

// Список комментариев
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
  
  // Стили скроллбара
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: #0f172a;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #475569;
    border-radius: 3px;
    
    &:hover {
      background: #64748b;
    }
  }
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
  margin-bottom: 20px;
  
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

// Адаптивность
@media (max-width: 768px) {
  .task-section {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .comments-list {
    max-height: 300px;
  }
}
</style>