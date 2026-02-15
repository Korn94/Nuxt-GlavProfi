<!-- app/components/pages/cabinet/Boards/ui/BoardCommentForm.vue -->
 <template>
  <div class="board-comment-form">
    <div class="board-comment-form-header">
      <div class="board-comment-form-avatar">
        {{ getInitials(currentUser?.name) }}
      </div>
      <div class="board-comment-form-input-wrapper">
        <textarea
          v-model="newComment"
          class="board-comment-form-input"
          placeholder="Напишите комментарий..."
          rows="3"
          @input="handleInput"
        ></textarea>
        <div v-if="newComment.trim()" class="board-comment-form-actions">
          <button class="btn btn-secondary" @click="clearComment">
            Отмена
          </button>
          <button class="btn btn-primary" @click="addComment" :disabled="addingComment">
            {{ addingComment ? 'Отправка...' : 'Отправить' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../../../../../../stores/auth'

// Emits
const emit = defineEmits<{
  commentAdded: []
}>()

// State
const newComment = ref('')
const addingComment = ref(false)

// Computed
const authStore = useAuthStore()
const currentUser = computed(() => authStore.user)

// Methods
const getInitials = (name?: string) => {
  if (!name || name.trim() === '') return 'U'
  
  // Фильтруем пустые строки
  const parts = name.trim().split(' ').filter(part => part.length > 0)
  
  if (parts.length >= 2) {
    // Добавляем проверку на существование символов
    const first = parts[0][0] ?? ''
    const second = parts[1][0] ?? ''
    return (first + second).toUpperCase()
  }
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return 'U'
}

const handleInput = () => {
  // Автоматически увеличиваем высоту textarea при вводе
  const textarea = document.querySelector('.board-comment-form-input') as HTMLTextAreaElement
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = textarea.scrollHeight + 'px'
  }
}

const addComment = async () => {
  if (!newComment.value.trim()) return
  
  addingComment.value = true
  
  try {
    // TODO: Добавить комментарий через API
    console.log('Add comment:', newComment.value)
    
    newComment.value = ''
    emit('commentAdded')
  } catch (error) {
    console.error('Failed to add comment:', error)
  } finally {
    addingComment.value = false
  }
}

const clearComment = () => {
  newComment.value = ''
}
</script>

<style scoped lang="scss">
.board-comment-form {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.board-comment-form-header {
  display: flex;
  gap: 12px;
}

.board-comment-form-avatar {
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

.board-comment-form-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-comment-form-input {
  width: 100%;
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  line-height: 1.6;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
  
  &::placeholder {
    color: #64748b;
  }
}

.board-comment-form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: #4b5563;
  color: #fff;
  
  &:hover {
    background: #374151;
  }
}
</style>