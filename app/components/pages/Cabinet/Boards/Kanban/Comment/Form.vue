<!-- app/components/pages/cabinet/Boards/Kanban/Comment/Form.vue -->
 <template>
<div class="comment-form">
  <div class="comment-form-header">
    <div class="comment-form-avatar">
      {{ getInitials(currentUser?.name) }}
    </div>
    <div class="comment-form-input-wrapper">
      <textarea
        v-model="newComment"
        ref="textareaRef"
        class="comment-form-input"
        :placeholder="placeholder"
        rows="3"
        @input="handleInput"
        @keydown.enter.exact.prevent="addComment"
      ></textarea>
      <div v-if="newComment.trim()" class="comment-form-actions">
        <button class="btn btn-secondary" @click="clearComment">
          Отмена
        </button>
        <button class="btn btn-primary" @click="addComment" :disabled="addingComment">
          <span v-if="addingComment">
            <Icon name="mdi:loading" class="btn-icon spin" />
            Отправка...
          </span>
          <span v-else>Отправить</span>
        </button>
      </div>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useNotifications } from '~/composables/useNotifications'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  taskId?: number
  parentId?: number | null
  placeholder?: string
}>()

const emit = defineEmits<{
  commentAdded: []
}>()

// ============================================
// STATE
// ============================================
const newComment = ref('')
const addingComment = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// ============================================
// STORES
// ============================================
const authStore = useAuthStore()
const notifications = useNotifications()

// ============================================
// COMPUTED
// ============================================
const currentUser = computed(() => authStore.user)

// ============================================
// METHODS
// ============================================
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

const handleInput = () => {
  // Автоматически увеличиваем высоту textarea при вводе
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${textareaRef.value.scrollHeight}px`
  }
}

const addComment = async () => {
  const trimmedComment = newComment.value.trim()
  if (!trimmedComment) {
    notifications.warning('Комментарий не может быть пустым')
    return
  }

  addingComment.value = true

  try {
    // TODO: Добавить комментарий через API
    console.log('Add comment:', {
      taskId: props.taskId,
      parentId: props.parentId,
      comment: trimmedComment
    })

    newComment.value = ''
    emit('commentAdded')
    
    notifications.success('Комментарий добавлен')

    // Сбрасываем высоту textarea
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
  } catch (error) {
    console.error('Failed to add comment:', error)
    notifications.error('Не удалось добавить комментарий')
  } finally {
    addingComment.value = false
  }
}

const clearComment = () => {
  newComment.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  // Фокус на textarea при монтировании (если нужно)
  nextTick(() => {
    if (textareaRef.value && props.placeholder) {
      // Можно добавить фокус при необходимости
    }
  })
})
</script>

<style scoped lang="scss">
.comment-form {
  background: #1e293b;
  border-radius: 8px;
  padding: 16px;
}

.comment-form-header {
  display: flex;
  gap: 12px;
}

.comment-form-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: $blue;
  color: $text-light;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.comment-form-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-form-input {
  width: 100%;
  padding: 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: $text-light;
  font-size: 15px;
  font-family: inherit;
  resize: none;
  line-height: 1.6;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
}

.comment-form-actions {
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: $blue;
  color: $text-light;

  // &:hover:not(:disabled) {
  //   background: darken($blue, 10%);
  // }
}

.btn-secondary {
  background: #4b5563;
  color: $text-light;

  &:hover:not(:disabled) {
    background: #374151;
  }
}

.btn-icon {
  display: inline-block;
  width: 18px;
  height: 18px;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>