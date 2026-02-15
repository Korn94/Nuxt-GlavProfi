<!-- app/components/pages/cabinet/Boards/ui/BoardTaskDetails.vue -->
 <template>
  <div class="board-task-details-modal">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <div class="modal-header-content">
            <div class="task-header-row">
              <div class="task-priority-status">
                <span class="task-priority" :class="`priority-${task.priority}`">
                  {{ getPriorityLabel(task.priority) }}
                </span>
                <span class="task-status" :class="`status-${task.status}`">
                  {{ getStatusLabel(task.status) }}
                </span>
              </div>
              <button class="modal-close" @click="$emit('close')">✕</button>
            </div>

            <h2 class="task-title">{{ task.title }}</h2>
          </div>
        </div>

        <div class="modal-body">
          <div class="task-details-grid">
            <div class="task-main-content">
              <!-- Описание -->
              <div class="task-section">
                <h3 class="task-section-title">Описание</h3>
                <div v-if="editingDescription" class="task-description-edit">
                  <textarea
                    v-model="editedDescription"
                    class="form-control"
                    rows="4"
                  ></textarea>
                  <div class="task-description-actions">
                    <button class="btn btn-secondary" @click="editingDescription = false">
                      Отмена
                    </button>
                    <button class="btn btn-primary" @click="saveDescription">
                      Сохранить
                    </button>
                  </div>
                </div>
                <div v-else class="task-description">
                  <p v-if="task.description">{{ task.description }}</p>
                  <p v-else class="text-muted">Описание отсутствует</p>
                  <button class="btn btn-text" @click="startEditDescription">
                    ✏️ Редактировать
                  </button>
                </div>
              </div>

              <!-- Подзадачи -->
              <div class="task-section">
                <div class="task-section-header">
                  <h3 class="task-section-title">
                    Подзадачи
                    <span class="task-section-count">
                      {{ getCompletedSubtasksCount() }}/{{ getAllSubtasksCount() }}
                    </span>
                  </h3>
                  <button class="btn btn-sm btn-primary" @click="showAddRootSubtask = true">
                    + Добавить
                  </button>
                </div>

                <!-- ✅ ФОРМА ДОБАВЛЕНИЯ КОРНЕВОЙ ПОДЗАДАЧИ -->
                <div v-if="showAddRootSubtask" class="subtask-add-form">
                  <input
                    v-model="newRootSubtask.title"
                    type="text"
                    class="form-control"
                    placeholder="Название подзадачи"
                    @keyup.enter="addRootSubtask"
                  />
                  <div class="subtask-add-actions">
                    <button class="btn btn-secondary" @click="showAddRootSubtask = false">
                      Отмена
                    </button>
                    <button class="btn btn-primary" @click="addRootSubtask">
                      Добавить
                    </button>
                  </div>
                </div>

                <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks-list">
                  <BoardSubtaskTree
                    :subtasks="task.subtasks"
                    :task-id="task.id"
                    @subtask-updated="handleSubtaskUpdated"
                  />
                </div>
                <div v-else-if="!showAddRootSubtask" class="empty-state">
                  <p>Нет подзадач</p>
                </div>
              </div>

              <!-- Комментарии -->
              <div class="task-section">
                <div class="task-section-header">
                  <h3 class="task-section-title">
                    Комментарии
                    <span class="task-section-count">{{ task.comments?.length || 0 }}</span>
                  </h3>
                </div>

                <div v-if="task.comments && task.comments.length > 0" class="comments-list">
                  <BoardComment
                    v-for="comment in task.comments"
                    :key="comment.id"
                    :comment="comment"
                  />
                </div>
                <div v-else class="empty-state">
                  <p>Нет комментариев</p>
                </div>

                <BoardCommentForm @comment-added="handleCommentAdded" />
              </div>
            </div>

            <div class="task-sidebar">
              <!-- Информация о задаче -->
              <div class="task-sidebar-section">
                <h4 class="task-sidebar-title">Информация</h4>
                
                <div class="task-info-item">
                  <span class="task-info-label">Создана:</span>
                  <span class="task-info-value">
                    {{ formatDate(task.createdAt) }}
                  </span>
                </div>

                <div v-if="task.dueDate" class="task-info-item">
                  <span class="task-info-label">Срок:</span>
                  <span class="task-info-value">
                    {{ formatDate(task.dueDate) }}
                  </span>
                </div>

                <div v-if="task.completedDate" class="task-info-item">
                  <span class="task-info-label">Завершена:</span>
                  <span class="task-info-value">
                    {{ formatDate(task.completedDate) }}
                  </span>
                </div>
              </div>

              <!-- Теги -->
              <div class="task-sidebar-section">
                <div class="task-sidebar-header">
                  <h4 class="task-sidebar-title">Теги</h4>
                  <button class="btn btn-sm btn-secondary" @click="showAddTag = true">
                    +
                  </button>
                </div>

                <div v-if="task.tags && task.tags.length > 0" class="task-tags">
                  <span
                    v-for="tag in task.tags"
                    :key="tag.id"
                    class="task-tag"
                    :style="{ backgroundColor: tag.color }"
                  >
                    {{ tag.name }}
                  </span>
                </div>
                <div v-else class="empty-state">
                  <p>Нет тегов</p>
                </div>
              </div>

              <!-- Вложения -->
              <div class="task-sidebar-section">
                <div class="task-sidebar-header">
                  <h4 class="task-sidebar-title">Вложения</h4>
                  <button class="btn btn-sm btn-secondary" @click="showUploadFile = true">
                    📎
                  </button>
                </div>

                <div v-if="task.attachments && task.attachments.length > 0" class="task-attachments">
                  <div v-for="attachment in task.attachments" :key="attachment.id" class="task-attachment">
                    <a :href="attachment.fileUrl" target="_blank" class="attachment-link">
                      📄 {{ attachment.fileName }}
                    </a>
                    <span class="attachment-size">
                      ({{ formatFileSize(attachment.fileSize) }})
                    </span>
                  </div>
                </div>
                <div v-else class="empty-state">
                  <p>Нет вложений</p>
                </div>
              </div>

              <!-- Быстрые действия -->
              <div class="task-sidebar-section">
                <h4 class="task-sidebar-title">Действия</h4>
                
                <div class="task-actions">
                  <button class="btn btn-block btn-warning" @click="handleStatusChange('blocked')">
                    Заблокировать
                  </button>
                  <button class="btn btn-block btn-success" @click="handleStatusChange('done')">
                    Завершить
                  </button>
                  <button class="btn btn-block btn-danger" @click="handleDelete">
                    Удалить задачу
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BoardSubtaskTree from './BoardSubtaskTree.vue'
import BoardComment from './BoardComment.vue'
import BoardCommentForm from './BoardCommentForm.vue'
import { useSubtasks } from '~/composables/boards/useSubtasks';
import { useNotifications } from '~/composables/useNotifications';

// Props
const props = defineProps<{
  task: any
}>()

// Emits
const emit = defineEmits<{
  close: []
  taskUpdated: []
  taskDeleted: []
}>()

// State
const editingDescription = ref(false)
const editedDescription = ref(props.task.description || '')
const showAddSubtask = ref(false)
const showAddRootSubtask = ref(false)
const newRootSubtask = ref({
  title: ''
})
const { createSubtask } = useSubtasks()
const notifications = useNotifications()
const showAddTag = ref(false)
const showUploadFile = ref(false)

// Methods
const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочно'
  }
  return labels[priority] || priority
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

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const startEditDescription = () => {
  editedDescription.value = props.task.description || ''
  editingDescription.value = true
}

const saveDescription = async () => {
  // TODO: Сохранить описание через API
  console.log('Save description:', editedDescription.value)
  editingDescription.value = false
  emit('taskUpdated')
}

const getCompletedSubtasksCount = () => {
  if (!props.task.subtasks) return 0
  
  let count = 0
  const countCompleted = (subs: any[]) => {
    subs.forEach(sub => {
      if (sub.isCompleted) count++
      if (sub.subtasks && sub.subtasks.length > 0) {
        countCompleted(sub.subtasks)
      }
    })
  }
  
  countCompleted(props.task.subtasks)
  return count
}

const getAllSubtasksCount = () => {
  if (!props.task.subtasks) return 0
  
  let count = 0
  const countAll = (subs: any[]) => {
    subs.forEach(sub => {
      count++
      if (sub.subtasks && sub.subtasks.length > 0) {
        countAll(sub.subtasks)
      }
    })
  }
  
  countAll(props.task.subtasks)
  return count
}

const handleSubtaskUpdated = () => {
  emit('taskUpdated')
}

const handleCommentAdded = () => {
  emit('taskUpdated')
}

const handleStatusChange = async (status: string) => {
  // TODO: Изменить статус через API
  console.log('Change status to:', status)
  emit('taskUpdated')
}

const handleDelete = async () => {
  if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
    // TODO: Удалить задачу через API
    console.log('Delete task:', props.task.id)
    emit('taskDeleted')
    emit('close')
  }
}

const addRootSubtask = async () => {
  const title = newRootSubtask.value.title.trim()
  if (!title) {
    notifications.warning('Введите название подзадачи')
    return
  }
  
  try {
    await createSubtask(props.task.id, {
      title: title,
      description: '',
      parentId: null, // ← Корневая подзадача (без родителя)
      order: 0
    })
    
    showAddSubtask.value = false
    newRootSubtask.value = { title: '' }
    emit('taskUpdated')
    notifications.success('Подзадача добавлена')
  } catch (error) {
    console.error('Failed to create subtask:', error)
    notifications.error('Не удалось добавить подзадачу')
  }
}

watch(() => props.task, (newTask) => {
  if (newTask) {
    // Можно добавить логику для обновления внутреннего состояния
    // Например, сбросить форму редактирования описания
    if (editingDescription.value) {
      editedDescription.value = newTask.description || ''
    }
  }
}, { immediate: true })
</script>

<style scoped lang="scss">
.board-task-details-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
}

.modal-overlay {
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.modal {
  background: #0f172a;
  border-radius: 16px;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  background: #1e293b;
  padding: 24px;
  border-bottom: 1px solid #334155;
}

.modal-header-content {
  max-width: 100%;
}

.task-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-priority-status {
  display: flex;
  gap: 10px;
}

.task-priority,
.task-status {
  display: inline-block;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 6px;
  text-transform: uppercase;
}

.task-priority.priority-low {
  background: #334155;
  color: #94a3b8;
}

.task-priority.priority-medium {
  background: #1e3a8a;
  color: #93c5fd;
}

.task-priority.priority-high {
  background: #7c3aed;
  color: #ddd6fe;
}

.task-priority.priority-urgent {
  background: #b91c1c;
  color: #fecaca;
}

.task-status.status-todo {
  background: #334155;
  color: #94a3b8;
}

.task-status.status-in_progress {
  background: #1e3a8a;
  color: #93c5fd;
}

.task-status.status-review {
  background: #7c3aed;
  color: #ddd6fe;
}

.task-status.status-done {
  background: #047857;
  color: #dcfce7;
}

.task-status.status-blocked {
  background: #b91c1c;
  color: #fecaca;
}

.task-status.status-cancelled {
  background: #4b5563;
  color: #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #334155;
    color: #fff;
  }
}

.task-title {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  line-height: 1.3;
}

.modal-body {
  padding: 24px;
  max-height: calc(90vh - 150px);
  overflow-y: auto;
}

.task-details-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

.task-main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.task-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: #334155;
  color: #94a3b8;
  font-size: 12px;
  border-radius: 12px;
}

.task-description {
  color: #cbd5e1;
  line-height: 1.6;
}

.task-description p {
  margin: 0 0 12px 0;
}

.text-muted {
  color: #64748b;
  font-style: italic;
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

.task-description-edit {
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
  color: #fff;
  font-size: 15px;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
}

.task-description-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 15px;
}

.task-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.task-sidebar-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.task-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.task-sidebar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.task-info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #334155;
  
  &:last-child {
    border-bottom: none;
  }
}

.task-info-label {
  color: #94a3b8;
  font-size: 14px;
}

.task-info-value {
  color: #cbd5e1;
  font-size: 14px;
  font-weight: 500;
}

.task-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-tag {
  display: inline-block;
  padding: 6px 12px;
  font-size: 13px;
  color: #fff;
  border-radius: 6px;
  font-weight: 500;
}

.task-attachments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-attachment {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #0f172a;
  border-radius: 8px;
}

.attachment-link {
  color: #60a5fa;
  text-decoration: none;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
}

.attachment-size {
  color: #64748b;
  font-size: 13px;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-block {
  width: 100%;
  padding: 10px;
  text-align: center;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-warning {
  background: #b91c1c;
  color: #fff;
  
  &:hover {
    background: #991b1b;
  }
}

.btn-success {
  background: #047857;
  color: #fff;
  
  &:hover {
    background: #065f46;
  }
}

.btn-danger {
  background: #dc2626;
  color: #fff;
  
  &:hover {
    background: #b91c1c;
  }
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
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
}

.btn-secondary {
  background: #4b5563;
  color: #fff;
  
  &:hover {
    background: #374151;
  }
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.subtasks-list,
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.subtask-add-form {
  margin-bottom: 16px;
  padding: 16px;
  background: #1e293b;
  border-radius: 8px;
}

.subtask-add-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>