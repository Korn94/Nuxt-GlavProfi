<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Comments/Comment.vue -->
<template>
  <div class="comment" :class="{ 'comment-with-replies': hasReplies }">
    <!-- Шапка комментария -->
    <div class="comment-header">
      <div class="comment-author">
        <div class="comment-avatar" :style="{ background: avatarColor }">
          {{ getInitials(comment.user?.name || 'U') }}
        </div>
        <div class="comment-author-info">
          <div class="comment-author-name">
            {{ comment.user?.name || 'Неизвестный пользователь' }}
            <span v-if="isAuthor" class="author-badge">(Вы)</span>
          </div>
          <div class="comment-time" :title="fullDate">
            {{ timeAgo }}
          </div>
        </div>
      </div>
      
      <!-- Кнопки действий -->
      <div v-if="canEdit || canDelete" class="comment-actions">
        <button
          v-if="canEdit"
          class="btn btn-sm btn-text"
          @click="startEditing"
          title="Редактировать"
        >
          <Icon name="mdi:pencil" size="14" />
        </button>
        <button
          v-if="canDelete"
          class="btn btn-sm btn-text btn-danger"
          @click="handleDelete"
          title="Удалить"
        >
          <Icon name="mdi:delete" size="14" />
        </button>
      </div>
    </div>
    
    <!-- Режим просмотра -->
    <div v-if="!isEditing" class="comment-content">
      <p>{{ comment.comment }}</p>
    </div>
    
    <!-- Режим редактирования -->
    <div v-else class="comment-edit">
      <textarea
        ref="textareaRef"
        v-model="editedComment"
        class="form-control"
        rows="3"
        @keydown.ctrl.enter="saveComment"
        @keydown.meta.enter="saveComment"
      ></textarea>
      
      <div class="comment-edit-actions">
        <div class="edit-hints">
          <span class="hint">
            <Icon name="mdi:keyboard" size="12" />
            Ctrl+Enter для сохранения
          </span>
        </div>
        <div class="edit-buttons">
          <button
            class="btn btn-secondary"
            @click="cancelEditing"
            :disabled="saving"
          >
            Отмена
          </button>
          <button
            class="btn btn-primary"
            @click="saveComment"
            :disabled="saving || !canSave"
          >
            <Icon v-if="saving" name="mdi:loading" size="14" class="spin" />
            <Icon v-else name="mdi:check" size="14" />
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Ответы на комментарий -->
    <div v-if="hasReplies" class="comment-replies">
      <div class="replies-header">
        <span class="replies-count">
          <Icon name="mdi:reply" size="14" />
          {{ comment.replies?.length || 0 }} {{ declension(comment.replies?.length || 0, ['ответ', 'ответа', 'ответов']) }}
        </span>
      </div>
      
      <div class="replies-list">
        <Comment
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          :task-id="taskId"
          @updated="$emit('updated')"
          @deleted="$emit('deleted')"
        />
      </div>
    </div>
    
    <!-- Форма ответа -->
    <div v-if="!isEditing" class="comment-reply-section">
      <button
        v-if="!showReplyForm"
        class="btn btn-text btn-reply"
        @click="showReplyForm = true"
      >
        <Icon name="mdi:reply" size="14" />
        Ответить
      </button>
      
      <CommentForm
        v-else
        :task-id="taskId"
        :parent-id="comment.id"
        @added="handleReplyAdded"
        @cancel="showReplyForm = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useNotifications } from '~/composables/useNotifications'
import CommentForm from './Form.vue'
import type { Comment as CommentType } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  comment: CommentType
  taskId?: number
}>()

const emit = defineEmits<{
  updated: []
  deleted: []
}>()

// ============================================
// STORES
// ============================================
const authStore = useAuthStore()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const isEditing = ref(false)
const editedComment = ref(props.comment.comment)
const showReplyForm = ref(false)
const saving = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// ============================================
// COMPUTED
// ============================================
const currentUser = computed(() => authStore.user)

const isAuthor = computed(() => {
  return currentUser.value?.id === props.comment.userId
})

const canEdit = computed(() => {
  return isAuthor.value || currentUser.value?.role === 'admin'
})

const canDelete = computed(() => {
  return isAuthor.value || currentUser.value?.role === 'admin'
})

const canSave = computed(() => {
  return editedComment.value.trim() !== props.comment.comment.trim() &&
         editedComment.value.trim().length > 0
})

const hasReplies = computed(() => {
  return props.comment.replies && props.comment.replies.length > 0
})

const timeAgo = computed(() => {
  if (!props.comment.createdAt) return ''
  
  const date = new Date(props.comment.createdAt)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMinutes < 1) return 'только что'
  if (diffMinutes < 60) return `${diffMinutes} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays < 7) return `${diffDays} дн назад`
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
})

const fullDate = computed(() => {
  if (!props.comment.createdAt) return ''
  
  const date = new Date(props.comment.createdAt)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const avatarColor = computed(() => {
  const colors = [
    '#00c3f5', '#00A12A', '#7c3aed', '#FAB702',
    '#e83e8c', '#17a2b8', '#28a745', '#dc3545'
  ]
  
  const userId = props.comment.userId || 0
  const index = userId % colors.length
  return colors[index]
})

// ============================================
// METHODS
// ============================================
const getInitials = (name: string) => {
  if (!name || name.trim() === '') return 'U'
  
  const parts = name.trim().split(' ').filter(part => part.length > 0)
  
  if (parts.length >= 2) {
    const first = parts[0][0] ?? ''
    const second = parts[1][0] ?? ''
    return (first + second).toUpperCase()
  }
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return 'U'
}

const declension = (number: number, titles: string[]) => {
  const cases = [2, 0, 1, 1, 1, 2]
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]]
}

const startEditing = async () => {
  editedComment.value = props.comment.comment
  isEditing.value = true
  
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.focus()
    textareaRef.value.select()
  }
}

const cancelEditing = () => {
  isEditing.value = false
  editedComment.value = props.comment.comment
}

const saveComment = async () => {
  const trimmedComment = editedComment.value.trim()
  
  if (!trimmedComment) {
    notifications.warning('Комментарий не может быть пустым')
    return
  }
  
  if (trimmedComment === props.comment.comment.trim()) {
    cancelEditing()
    return
  }
  
  saving.value = true
  
  try {
    // TODO: Вызов API для обновления комментария
    // await $fetch(`/api/boards/comments/${props.comment.id}`, {
    //   method: 'PUT',
    //   body: { comment: trimmedComment }
    // })
    
    console.log('Save comment:', props.comment.id, trimmedComment)
    
    notifications.success('Комментарий обновлён')
    emit('updated')
    cancelEditing()
  } catch (error) {
    console.error('Failed to save comment:', error)
    notifications.error('Не удалось сохранить комментарий')
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
    try {
      // TODO: Вызов API для удаления комментария
      // await $fetch(`/api/boards/comments/${props.comment.id}`, {
      //   method: 'DELETE'
      // })
      
      console.log('Delete comment:', props.comment.id)
      
      notifications.success('Комментарий удалён')
      emit('deleted')
    } catch (error) {
      console.error('Failed to delete comment:', error)
      notifications.error('Не удалось удалить комментарий')
    }
  }
}

const handleReplyAdded = () => {
  showReplyForm.value = false
  emit('updated')
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.comment {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  
  &:not(:last-child) {
    margin-bottom: 12px;
  }
  
  &:hover {
    background: #253347;
  }
  
  &.comment-with-replies {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}

// Шапка комментария
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.comment-author {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: $text-light;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  text-transform: uppercase;
}

.comment-author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-author-name {
  font-size: 14px;
  font-weight: 600;
  color: $text-light;
  display: flex;
  align-items: center;
  gap: 6px;
  
  .author-badge {
    font-size: 11px;
    font-weight: 500;
    color: $blue;
    background: rgba($blue, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
  }
}

.comment-time {
  font-size: 12px;
  color: #64748b;
}

// Кнопки действий
.comment-actions {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

// Контент комментария
.comment-content {
  color: #cbd5e1;
  line-height: 1.6;
  
  p {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

// Режим редактирования
.comment-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-control {
  width: 100%;
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: $text-light;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  line-height: 1.5;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
}

.comment-edit-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.edit-hints {
  display: flex;
  align-items: center;
  gap: 6px;
  
  .hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #64748b;
    
    .icon {
      color: #475569;
    }
  }
}

.edit-buttons {
  display: flex;
  gap: 8px;
}

// Ответы на комментарий
.comment-replies {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #334155;
}

.replies-header {
  margin-bottom: 12px;
}

.replies-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  
  .icon {
    color: #475569;
  }
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 24px;
  border-left: 2px solid #334155;
  margin-top: 12px;
}

// Форма ответа
.comment-reply-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.btn-reply {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba($blue, 0.1);
  color: $blue;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba($blue, 0.2);
  }
}

// Кнопки
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-sm {
  padding: 4px 8px;
  font-size: 12px;
}

.btn-text {
  background: transparent;
  color: #64748b;
  
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: $text-light;
  }
  
  &.btn-danger {
    color: $red;
    
    &:hover:not(:disabled) {
      background: rgba($red, 0.1);
    }
  }
}

.btn-primary {
  background: $blue;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: lighten($blue, 5%);
    transform: translateY(-1px);
  }
}

.btn-secondary {
  background: #475569;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #64748b;
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
  .comment {
    padding: 12px;
  }
  
  .comment-header {
    flex-wrap: wrap;
  }
  
  .comment-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 8px;
    margin-left: 48px;
  }
  
  .replies-list {
    padding-left: 16px;
  }
}
</style>