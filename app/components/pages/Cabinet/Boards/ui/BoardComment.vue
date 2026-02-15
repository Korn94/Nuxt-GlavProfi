<!-- app/components/pages/cabinet/Boards/ui/BoardComment.vue -->
<template>
  <div class="board-comment">
    <div class="board-comment-header">
      <div class="board-comment-author">
        <div class="board-comment-avatar">
          {{ getInitials(comment.user?.name || 'U') }}
        </div>
        <div class="board-comment-author-info">
          <div class="board-comment-author-name">
            {{ comment.user?.name || 'Неизвестный пользователь' }}
          </div>
          <div class="board-comment-time">
            {{ formatDate(comment.createdAt) }}
          </div>
        </div>
      </div>
      
      <div class="board-comment-actions">
        <button v-if="canEdit" class="btn btn-sm btn-text" @click="editing = true">
          ✏️
        </button>
        <button v-if="canDelete" class="btn btn-sm btn-text" @click="handleDelete">
          🗑️
        </button>
      </div>
    </div>

    <div v-if="editing" class="board-comment-edit">
      <textarea
        v-model="editedComment"
        class="form-control"
        rows="3"
      ></textarea>
      <div class="board-comment-edit-actions">
        <button class="btn btn-secondary" @click="editing = false">
          Отмена
        </button>
        <button class="btn btn-primary" @click="saveComment">
          Сохранить
        </button>
      </div>
    </div>

    <div v-else class="board-comment-content">
      <p>{{ comment.comment }}</p>
    </div>

    <div v-if="comment.replies && comment.replies.length > 0" class="board-comment-replies">
      <div class="board-comment-replies-title">
        Ответы ({{ comment.replies.length }})
      </div>
      <div class="board-comment-replies-list">
        <BoardComment
          v-for="reply in comment.replies"
          :key="reply.id"
          :comment="reply"
          @comment-updated="$emit('comment-updated')"
          @comment-deleted="$emit('comment-deleted')"
        />
      </div>
    </div>

    <div v-if="!editing" class="board-comment-reply">
      <button class="btn btn-text" @click="showReplyForm = !showReplyForm">
        Ответить
      </button>
      
      <div v-if="showReplyForm" class="board-comment-reply-form">
        <textarea
          v-model="replyComment"
          class="form-control"
          placeholder="Напишите ответ..."
          rows="2"
        ></textarea>
        <div class="board-comment-reply-actions">
          <button class="btn btn-secondary" @click="showReplyForm = false">
            Отмена
          </button>
          <button class="btn btn-primary" @click="addReply">
            Отправить
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  comment: {
    id: number
    comment: string
    userId: number
    createdAt: string
    updatedAt: string
    user?: {
      id: number
      name: string
      login: string
    } | null
    replies?: any[]
  }
}

const props = defineProps<Props>()

// Emits
interface Emits {
  (e: 'comment-updated'): void
  (e: 'comment-deleted'): void
}

const emit = defineEmits<Emits>()

// State
const editing = ref(false)
const editedComment = ref(props.comment.comment)
const showReplyForm = ref(false)
const replyComment = ref('')

// Computed
const currentUser = computed(() => {
  // TODO: Получить текущего пользователя из стора
  return null
})

const canEdit = computed(() => {
  return currentUser.value?.id === props.comment.userId || currentUser.value?.role === 'admin'
})

const canDelete = computed(() => {
  return currentUser.value?.id === props.comment.userId || currentUser.value?.role === 'admin'
})

// Methods
const getInitials = (name?: string) => {
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffHours < 24) {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const saveComment = async () => {
  if (!editedComment.value.trim()) return
  
  // TODO: Сохранить комментарий через API
  console.log('Save comment:', props.comment.id, editedComment.value)
  editing.value = false
  emit('comment-updated')
}

const handleDelete = async () => {
  if (confirm('Удалить комментарий?')) {
    // TODO: Удалить комментарий через API
    console.log('Delete comment:', props.comment.id)
    emit('comment-deleted')
  }
}

const addReply = async () => {
  if (!replyComment.value.trim()) return
  
  // TODO: Добавить ответ через API
  console.log('Add reply to:', props.comment.id, replyComment.value)
  replyComment.value = ''
  showReplyForm.value = false
  emit('comment-updated')
}
</script>

<style scoped lang="scss">
.board-comment {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
}

.board-comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.board-comment-author {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.board-comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.board-comment-author-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.board-comment-author-name {
  font-size: 15px;
  font-weight: 600;
  color: #fff;
}

.board-comment-time {
  font-size: 13px;
  color: #64748b;
}

.board-comment-actions {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

.board-comment-content {
  color: #cbd5e1;
  line-height: 1.6;
}

.board-comment-content p {
  margin: 0;
}

.board-comment-edit {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
}

.board-comment-edit-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.board-comment-replies {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #334155;
}

.board-comment-replies-title {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 12px;
}

.board-comment-replies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 24px;
  border-left: 2px solid #334155;
}

.board-comment-reply {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.btn-text {
  background: none;
  border: none;
  color: #60a5fa;
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  text-align: left;
  
  &:hover {
    color: #3b82f6;
    text-decoration: underline;
  }
}

.board-comment-reply-form {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-comment-reply-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

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
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
  
  &:hover {
    background: #2563eb;
  }
}

.btn-secondary {
  background: #4b5563;
  color: #fff;
  
  &:hover {
    background: #374151;
  }
}

.btn-sm {
  padding: 4px 8px;
  font-size: 14px;
}
</style>