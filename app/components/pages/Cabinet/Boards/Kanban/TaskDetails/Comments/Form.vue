<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Comments/Form.vue -->
<template>
  <div class="comment-form">
    <div class="comment-form-header">
      <div class="comment-form-avatar" :style="{ background: avatarColor }">
        {{ getInitials(currentUser?.name || 'U') }}
      </div>
      <div class="comment-form-input-wrapper">
        <textarea
          ref="textareaRef"
          v-model="newComment"
          class="comment-form-input"
          :placeholder="placeholder"
          rows="3"
          @input="handleInput"
          @keydown.ctrl.enter="addComment"
          @keydown.meta.enter="addComment"
        ></textarea>
        
        <div v-if="newComment.trim()" class="comment-form-actions">
          <div class="form-hints">
            <span class="hint">
              <Icon name="mdi:keyboard" size="14" />
              Ctrl+Enter для отправки
            </span>
            <span v-if="charCount > 0" class="char-count">
              {{ charCount }} символов
            </span>
          </div>
          <div class="form-buttons">
            <button
              v-if="parentId"
              class="btn btn-secondary"
              @click="cancelReply"
              :disabled="addingComment"
            >
              Отмена
            </button>
            <button
              class="btn btn-primary"
              @click="addComment"
              :disabled="addingComment || !canSubmit"
            >
              <Icon v-if="addingComment" name="mdi:loading" size="16" class="spin" />
              <Icon v-else name="mdi:send" size="16" />
              {{ addingComment ? 'Отправка...' : buttonText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from 'stores/auth'
import { useNotifications } from '~/composables/useNotifications'
import type { Comment } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = withDefaults(defineProps<{
  taskId?: number
  parentId?: number | null
  placeholder?: string
  autoFocus?: boolean
}>(), {
  placeholder: 'Напишите комментарий...',
  autoFocus: false
})

const emit = defineEmits<{
  added: [comment: Comment]
  cancel: []
}>()

// ============================================
// STORES
// ============================================
const authStore = useAuthStore()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const newComment = ref('')
const addingComment = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// ============================================
// COMPUTED
// ============================================
const currentUser = computed(() => authStore.user)

const canSubmit = computed(() => {
  return newComment.value.trim().length > 0 && newComment.value.trim().length <= 5000
})

const charCount = computed(() => {
  return newComment.value.length
})

const buttonText = computed(() => {
  return props.parentId ? 'Ответить' : 'Отправить'
})

const avatarColor = computed(() => {
  const colors = [
    '#00c3f5', '#00A12A', '#7c3aed', '#FAB702',
    '#e83e8c', '#17a2b8', '#28a745', '#dc3545'
  ]
  
  const userId = currentUser.value?.id || 0
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

const handleInput = () => {
  // Автоматически увеличиваем высоту textarea при вводе
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 300)}px`
  }
}

const addComment = async () => {
  const trimmedComment = newComment.value.trim()
  
  if (!trimmedComment) {
    notifications.warning('Комментарий не может быть пустым')
    return
  }
  
  if (trimmedComment.length > 5000) {
    notifications.warning('Комментарий слишком длинный (максимум 5000 символов)')
    return
  }
  
  if (!props.taskId) {
    notifications.error('ID задачи не указан')
    return
  }
  
  addingComment.value = true
  
  try {
    const response = await $fetch<{ success: boolean; comment: Comment }>(
      `/api/boards/tasks/${props.taskId}/comments`,
      {
        method: 'POST',
        body: {
          comment: trimmedComment,
          parentId: props.parentId || null
        }
      }
    )
    
    if (response.success && response.comment) {
      emit('added', response.comment)
      clearForm()
      notifications.success('Комментарий добавлен')
    }
  } catch (error: any) {
    console.error('Failed to add comment:', error)
    const message = error.data?.message || 'Не удалось добавить комментарий'
    notifications.error(message)
  } finally {
    addingComment.value = false
  }
}

const clearForm = () => {
  newComment.value = ''
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
  }
}

const cancelReply = () => {
  clearForm()
  emit('cancel')
}

const focusTextarea = async () => {
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.focus()
  }
}

// ============================================
// WATCHERS
// ============================================
watch(() => props.autoFocus, (newValue) => {
  if (newValue) {
    focusTextarea()
  }
}, { immediate: true })

watch(() => props.parentId, () => {
  if (props.parentId) {
    focusTextarea()
  }
})

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  if (props.autoFocus || props.parentId) {
    focusTextarea()
  }
})

// ============================================
// EXPOSE
// ============================================
defineExpose({
  focus: focusTextarea,
  clear: clearForm
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.comment-form {
  background: #1e293b;
  border-radius: 12px;
  padding: 16px;
  margin-top: 16px;
}

.comment-form-header {
  display: flex;
  gap: 12px;
}

.comment-form-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: $text-light;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 15px;
  flex-shrink: 0;
  text-transform: uppercase;
}

.comment-form-input-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-form-input {
  width: 100%;
  padding: 12px 14px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: $text-light;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  line-height: 1.6;
  min-height: 80px;
  max-height: 300px;
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

.comment-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.form-hints {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #64748b;
    
    .icon {
      color: #475569;
    }
  }
  
  .char-count {
    font-size: 12px;
    color: #64748b;
    
    &.warning {
      color: $yellow;
    }
    
    &.danger {
      color: $red;
    }
  }
}

.form-buttons {
  display: flex;
  gap: 10px;
}

// Кнопки
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
  .comment-form {
    padding: 12px;
  }
  
  .comment-form-header {
    gap: 10px;
  }
  
  .comment-form-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  .comment-form-actions {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .form-hints {
    order: 2;
  }
  
  .form-buttons {
    order: 1;
    width: 100%;
    
    .btn {
      flex: 1;
    }
  }
}
</style>