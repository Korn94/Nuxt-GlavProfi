<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sidebar/index.vue -->
 <template>
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
        <Icon name="mdi:tag-plus" size="14" />
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
        <Icon name="mdi:paperclip" size="14" />
      </button>
    </div>
    <div v-if="task.attachments && task.attachments.length > 0" class="task-attachments">
      <div v-for="attachment in task.attachments" :key="attachment.id" class="task-attachment">
        <a :href="attachment.fileUrl" target="_blank" class="attachment-link">
          <Icon name="mdi:file" size="16" />
          {{ truncateText(attachment.fileName, 25) }}
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
        <Icon name="mdi:block-helper" size="16" />
        Заблокировать
      </button>
      <button class="btn btn-block btn-success" @click="handleStatusChange('done')">
        <Icon name="mdi:check-circle" size="16" />
        Завершить
      </button>
      <button class="btn btn-block btn-danger" @click="handleDelete">
        <Icon name="mdi:delete" size="16" />
        Удалить задачу
      </button>
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Task } from '~/types/boards'

// Props
const props = defineProps<{
  task: Task
}>()

// Emits
const emit = defineEmits<{
  statusChange: [status: string]
  delete: []
}>()

// State
const showAddTag = ref(false)
const showUploadFile = ref(false)

// Methods
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

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const handleStatusChange = (status: string) => {
  emit('statusChange', status)
}

const handleDelete = () => {
  if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
    emit('delete')
  }
}
</script>

<style scoped lang="scss">
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
  color: $text-light;
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
  color: $text-light;
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
  display: flex;
  align-items: center;
  gap: 6px;
  color: $blue;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;

  // &:hover {
  //   color: darken($blue, 10%);
  //   text-decoration: underline;
  // }
}

.attachment-size {
  color: #64748b;
  font-size: 13px;
  margin-left: auto;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-warning {
  background: rgba($red, 0.2);
  color: $red;

  &:hover {
    background: rgba($red, 0.3);
  }
}

.btn-success {
  background: rgba($green, 0.2);
  color: $green;

  &:hover {
    background: rgba($green, 0.3);
  }
}

.btn-danger {
  background: rgba($red, 0.3);
  color: $text-light;

  &:hover {
    background: $red;
  }
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
  background: $blue;
  color: $text-light;

  // &:hover {
  //   background: darken($blue, 10%);
  // }
}

.btn-secondary {
  background: #4b5563;
  color: $text-light;

  &:hover {
    background: #374151;
  }
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.empty-state p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}
</style>