<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sidebar/Attachments.vue -->
<template>
  <div class="task-sidebar-section task-attachments-section">
    <div class="task-sidebar-header">
      <h4 class="task-sidebar-title">
        <Icon name="mdi:paperclip" size="18" />
        Вложения
      </h4>
      <button
        class="btn btn-sm btn-secondary"
        @click="showUploadModal = true"
        title="Загрузить файл"
      >
        <Icon name="mdi:plus" size="16" />
      </button>
    </div>
    
    <!-- Список вложений -->
    <div v-if="task.attachments && task.attachments.length > 0" class="attachments-list">
      <TransitionGroup name="attachment-list" tag="div">
        <div
          v-for="attachment in task.attachments"
          :key="attachment.id"
          class="attachment-item"
          :class="`attachment-type-${attachment.fileType}`"
        >
          <div class="attachment-icon">
            <Icon :name="getFileIcon(attachment.fileType)" size="24" />
          </div>
          <div class="attachment-info">
            <a
              :href="attachment.fileUrl"
              target="_blank"
              class="attachment-name"
              :title="attachment.fileName"
            >
              {{ truncateText(attachment.fileName, 30) }}
            </a>
            <div class="attachment-meta">
              <span class="attachment-size">{{ formatFileSize(attachment.fileSize) }}</span>
              <span class="attachment-date">{{ formatDate(attachment.createdAt) }}</span>
            </div>
          </div>
          <div class="attachment-actions">
            <button
              class="action-btn"
              @click="downloadFile(attachment)"
              title="Скачать"
            >
              <Icon name="mdi:download" size="16" />
            </button>
            <button
              class="action-btn btn-danger"
              @click="confirmDelete(attachment)"
              title="Удалить"
            >
              <Icon name="mdi:delete" size="16" />
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
    
    <!-- Пустое состояние -->
    <div v-else class="attachments-empty">
      <Icon name="mdi:file-upload-outline" size="48" />
      <p>Нет вложений</p>
      <span class="empty-hint">Нажмите "+", чтобы загрузить файлы</span>
    </div>
    
    <!-- Модалка загрузки файлов -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>Загрузить файлы</h3>
              <button class="modal-close" @click="closeUploadModal">
                <Icon name="mdi:close" size="24" />
              </button>
            </div>
            <div class="modal-body">
              <!-- Область drag & drop -->
              <div
                class="upload-dropzone"
                :class="{ 'drag-over': isDragOver }"
                @dragover.prevent="handleDragOver"
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <Icon name="mdi:cloud-upload-outline" size="48" class="dropzone-icon" />
                <p class="dropzone-text">Перетащите файлы сюда или кликните для выбора</p>
                <p class="dropzone-hint">
                  Максимальный размер: 100 МБ<br>
                  Поддерживаемые форматы: изображения, документы, видео
                </p>
                <input
                  ref="fileInputRef"
                  type="file"
                  multiple
                  class="file-input"
                  @change="handleFileSelect"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.mp4,.mov,.avi"
                />
              </div>
              
              <!-- Список выбранных файлов -->
              <div v-if="selectedFiles.length > 0" class="selected-files-list">
                <h4 class="selected-files-title">
                  Выбрано файлов: {{ selectedFiles.length }}
                </h4>
                <div
                  v-for="(file, index) in selectedFiles"
                  :key="index"
                  class="selected-file-item"
                >
                  <Icon :name="getFileIconFromName(file.name)" size="20" class="file-icon" />
                  <div class="file-info">
                    <span class="file-name">{{ truncateText(file.name, 40) }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  </div>
                  <button
                    class="remove-file-btn"
                    @click="removeFile(index)"
                    title="Удалить из списка"
                  >
                    <Icon name="mdi:close" size="16" />
                  </button>
                </div>
              </div>
              
              <!-- Прогресс загрузки -->
              <div v-if="uploading" class="upload-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{ width: `${uploadProgress}%` }"
                  ></div>
                </div>
                <span class="progress-text">{{ uploadProgress }}%</span>
              </div>
            </div>
            <div class="modal-actions">
              <button
                class="btn btn-secondary"
                @click="closeUploadModal"
                :disabled="uploading"
              >
                Отмена
              </button>
              <button
                class="btn btn-primary"
                @click="uploadFiles"
                :disabled="uploading || selectedFiles.length === 0"
              >
                <Icon v-if="uploading" name="mdi:loading" size="16" class="spin" />
                <Icon v-else name="mdi:upload" size="16" />
                {{ uploading ? 'Загрузка...' : `Загрузить (${selectedFiles.length})` }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    
    <!-- Модалка подтверждения удаления -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
          <div class="modal modal-sm" @click.stop>
            <div class="modal-header">
              <h3>Удаление вложения</h3>
              <button class="modal-close" @click="cancelDelete">
                <Icon name="mdi:close" size="24" />
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-warning">
                Вы уверены, что хотите удалить файл
                <strong>"{{ attachmentToDelete?.fileName }}"</strong>?
              </p>
              <p class="delete-info">
                Это действие нельзя отменить.
              </p>
            </div>
            <div class="modal-actions">
              <button
                class="btn btn-secondary"
                @click="cancelDelete"
                :disabled="deleting"
              >
                Отмена
              </button>
              <button
                class="btn btn-danger"
                @click="deleteAttachment"
                :disabled="deleting"
              >
                <Icon v-if="deleting" name="mdi:loading" size="16" class="spin" />
                {{ deleting ? 'Удаление...' : 'Удалить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useNotifications } from '~/composables/useNotifications'
import type { Attachment } from '~/types/boards'
import type { Task } from '~/types/boards'

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
// STORES & COMPOSABLES
// ============================================
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const showUploadModal = ref(false)
const showDeleteConfirm = ref(false)
const isDragOver = ref(false)
const uploading = ref(false)
const deleting = ref(false)
const uploadProgress = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFiles = ref<File[]>([])
const attachmentToDelete = ref<Attachment | null>(null)

// ============================================
// COMPUTED
// ============================================
const hasAttachments = computed(() => {
  return props.task.attachments && props.task.attachments.length > 0
})

// ============================================
// METHODS - Форматирование
// ============================================
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getFileIcon = (fileType: string): string => {
  const icons: Record<string, string> = {
    image: 'mdi:image',
    document: 'mdi:file-document',
    video: 'mdi:video',
    other: 'mdi:file'
  }
  return icons[fileType] || 'mdi:file'
}

const getFileIconFromName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'mdi:image'
  }
  if (['pdf'].includes(ext)) {
    return 'mdi:file-pdf'
  }
  if (['doc', 'docx'].includes(ext)) {
    return 'mdi:file-word'
  }
  if (['xls', 'xlsx'].includes(ext)) {
    return 'mdi:file-excel'
  }
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
    return 'mdi:video'
  }
  if (['txt'].includes(ext)) {
    return 'mdi:file-text'
  }
  
  return 'mdi:file'
}

const getFileType = (fileName: string): 'image' | 'document' | 'video' | 'other' => {
  const ext = fileName.split('.').pop()?.toLowerCase() || ''
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return 'image'
  }
  if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
    return 'video'
  }
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'].includes(ext)) {
    return 'document'
  }
  
  return 'other'
}

// ============================================
// METHODS - Загрузка файлов
// ============================================
const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const files = Array.from(input.files)
    const validFiles = files.filter(file => {
      if (file.size > 100 * 1024 * 1024) { // 100 MB
        notifications.warning(`Файл "${file.name}" превышает максимальный размер (100 МБ)`)
        return false
      }
      return true
    })
    selectedFiles.value = [...selectedFiles.value, ...validFiles]
  }
  // Очищаем input для возможности повторной загрузки тех же файлов
  input.value = ''
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    const files = Array.from(event.dataTransfer.files)
    const validFiles = files.filter(file => {
      if (file.size > 100 * 1024 * 1024) {
        notifications.warning(`Файл "${file.name}" превышает максимальный размер (100 МБ)`)
        return false
      }
      return true
    })
    selectedFiles.value = [...selectedFiles.value, ...validFiles]
  }
}

const removeFile = (index: number) => {
  selectedFiles.value.splice(index, 1)
}

const uploadFiles = async () => {
  if (selectedFiles.value.length === 0) return
  if (!props.task.id) {
    notifications.error('ID задачи не указан')
    return
  }
  
  uploading.value = true
  uploadProgress.value = 0
  
  try {
    const formData = new FormData()
    selectedFiles.value.forEach(file => {
      formData.append('files', file)
    })
    
    // Имитация прогресса (т.к. $fetch не поддерживает progress events напрямую)
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 200)
    
    const response = await $fetch<{
      success: boolean
      attachments: Attachment[]
      message: string
    }>(`/api/boards/tasks/${props.task.id}/attachments`, {
      method: 'POST',
      body: formData
    })
    
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    if (response.success) {
      notifications.success(response.message || 'Файлы загружены')
      emit('updated')
      closeUploadModal()
    }
  } catch (error: any) {
    console.error('Failed to upload attachments:', error)
    const message = error.data?.message || 'Не удалось загрузить файлы'
    notifications.error(message)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const closeUploadModal = () => {
  showUploadModal.value = false
  selectedFiles.value = []
  uploadProgress.value = 0
}

// ============================================
// METHODS - Удаление вложений
// ============================================
const confirmDelete = (attachment: Attachment) => {
  attachmentToDelete.value = attachment
  showDeleteConfirm.value = true
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
  attachmentToDelete.value = null
}

const deleteAttachment = async () => {
  if (!attachmentToDelete.value || !props.task.id) return
  
  deleting.value = true
  
  try {
    await $fetch<{ success: boolean; message: string }>(
      `/api/boards/tasks/${props.task.id}/attachments/${attachmentToDelete.value.id}`,
      {
        method: 'DELETE'
      }
    )
    
    notifications.success('Вложение удалено')
    emit('updated')
    cancelDelete()
  } catch (error: any) {
    console.error('Failed to delete attachment:', error)
    const message = error.data?.message || 'Не удалось удалить вложение'
    notifications.error(message)
  } finally {
    deleting.value = false
  }
}

const downloadFile = (attachment: Attachment) => {
  // Создаём временную ссылку для скачивания
  const link = document.createElement('a')
  link.href = attachment.fileUrl
  link.download = attachment.fileName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

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

// Список вложений
.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid #334155;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: $blue;
    background: #162030;
  }
  
  &.attachment-type-image {
    .attachment-icon {
      color: $green;
    }
  }
  
  &.attachment-type-document {
    .attachment-icon {
      color: $blue;
    }
  }
  
  &.attachment-type-video {
    .attachment-icon {
      color: $yellow;
    }
  }
}

.attachment-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  flex-shrink: 0;
}

.attachment-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attachment-name {
  color: $text-light;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  &:hover {
    color: $blue;
    text-decoration: underline;
  }
}

.attachment-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.attachment-size,
.attachment-date {
  font-size: 12px;
  color: #64748b;
}

.attachment-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .attachment-item:hover & {
    opacity: 1;
  }
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #334155;
    color: $text-light;
  }
  
  &.btn-danger {
    &:hover {
      background: rgba($red, 0.15);
      color: $red;
    }
  }
}

// Пустое состояние
.attachments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;
  
  .icon {
    margin-bottom: 16px;
    opacity: 0.5;
    color: #475569;
  }
  
  p {
    margin: 0 0 4px 0;
    font-size: 14px;
    color: #94a3b8;
  }
  
  .empty-hint {
    font-size: 12px;
    color: #64748b;
  }
}

// Модалка
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  padding: 20px;
}

.modal {
  background: #1e293b;
  border-radius: 12px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  
  &.modal-sm {
    max-width: 400px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #334155;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $text-light;
  }
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #334155;
    color: $text-light;
  }
}

.modal-body {
  padding: 20px;
}

// Drag & Drop зона
.upload-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #0f172a;
  border: 2px dashed #334155;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover,
  &.drag-over {
    border-color: $blue;
    background: rgba($blue, 0.05);
  }
  
  &.drag-over {
    transform: scale(1.02);
  }
}

.dropzone-icon {
  color: #64748b;
  margin-bottom: 16px;
  transition: color 0.2s ease;
  
  .upload-dropzone:hover &,
  .upload-dropzone.drag-over & {
    color: $blue;
  }
}

.dropzone-text {
  margin: 0 0 8px 0;
  font-size: 15px;
  font-weight: 500;
  color: $text-light;
  text-align: center;
}

.dropzone-hint {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  text-align: center;
  line-height: 1.5;
}

.file-input {
  display: none;
}

// Список выбранных файлов
.selected-files-list {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #334155;
}

.selected-files-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: $text-light;
}

.selected-file-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #0f172a;
  border-radius: 6px;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.file-icon {
  color: #64748b;
  flex-shrink: 0;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13px;
  color: $text-light;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 11px;
  color: #64748b;
}

.remove-file-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba($red, 0.15);
    color: $red;
  }
}

// Прогресс загрузки
.upload-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #334155;
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: #334155;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $blue, #7c3aed);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  min-width: 40px;
  text-align: right;
}

// Модалка удаления
.delete-warning {
  margin: 0 0 16px 0;
  color: $text-light;
  font-size: 15px;
  line-height: 1.5;
  
  strong {
    color: $blue;
  }
}

.delete-info {
  margin: 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.5;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #334155;
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

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.btn-secondary {
  background: #475569;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #64748b;
  }
}

.btn-primary {
  background: $blue;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: color.adjust($blue, $lightness: 5%);
    transform: translateY(-1px);
  }
}

.btn-danger {
  background: rgba($red, 0.15);
  color: $red;
  border: 1px solid rgba($red, 0.3);
  
  &:hover:not(:disabled) {
    background: rgba($red, 0.25);
  }
}

// Анимации
.attachment-list-enter-active,
.attachment-list-leave-active {
  transition: all 0.3s ease;
}

.attachment-list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.attachment-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

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
  .task-sidebar-section {
    padding: 16px;
  }
  
  .attachment-actions {
    opacity: 1;
  }
  
  .modal {
    max-width: 95%;
  }
  
  .upload-dropzone {
    padding: 30px 16px;
  }
  
  .dropzone-text {
    font-size: 14px;
  }
}
</style>