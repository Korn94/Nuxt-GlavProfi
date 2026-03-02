<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Comments/index.vue -->
<template>
  <div class="task-comments">
    <!-- Заголовок секции -->
    <div class="comments-header">
      <h3 class="comments-title">
        <Icon name="mdi:message-text-outline" size="20" />
        Комментарии
        <span class="comments-count">{{ totalCount }}</span>
      </h3>
    </div>
    
    <!-- Список комментариев -->
    <div v-if="comments && comments.length > 0" class="comments-list">
      <CommentItem
        v-for="comment in comments"
        :key="comment.id"
        :comment="comment"
        :task-id="taskId"
        @updated="$emit('updated')"
        @deleted="$emit('updated')"
      />
    </div>
    
    <!-- Пустое состояние -->
    <div v-else class="comments-empty">
      <Icon name="mdi:message-reply-text-outline" size="48" />
      <p>Нет комментариев</p>
      <span class="empty-hint">Будьте первым, кто оставит комментарий</span>
    </div>
    
    <!-- Форма добавления комментария -->
    <CommentForm
      :task-id="taskId"
      :parent-id="null"
      @added="$emit('updated')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CommentItem from './Comment.vue'
import CommentForm from './Form.vue'
import type { Comment } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  comments: Comment[]
  taskId: number
}>()

const emit = defineEmits<{
  updated: []
}>()

// ============================================
// COMPUTED
// ============================================
const totalCount = computed(() => {
  if (!props.comments) return 0
  return countAllComments(props.comments)
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

.task-comments {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.comments-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.comments-title {
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

.comments-count {
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
.comments-empty {
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
  .task-comments {
    padding: 16px;
  }
  
  .comments-list {
    max-height: 300px;
  }
}
</style>