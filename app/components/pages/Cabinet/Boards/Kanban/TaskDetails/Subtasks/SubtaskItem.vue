<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Subtasks/SubtaskItem.vue -->
<template>
  <div
    class="subtask-item"
    :class="{
      'completed': subtask.isCompleted,
      'editing': isEditing,
      'has-children': hasChildren,
      'dragging': isDragging,
      'drop-target': isDropTarget,
      'drop-above': dropPosition === 'above',
      'drop-below': dropPosition === 'below',
      'drop-child': dropPosition === 'child'
    }"
    :data-subtask-id="subtask.id"
    :data-depth="depth ?? 0"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragover.prevent="handleDragOver"
    @dragenter.prevent="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <!-- Основная строка подзадачи -->
    <div class="subtask-row">
      <!-- Индикатор глубины (визуальная линия) -->
      <div
        v-if="(depth ?? 0) > 0"
        class="depth-indicator"
        :style="{ marginLeft: `${((depth ?? 0) - 1) * 24}px` }"
      ></div>
      
      <!-- Чекбокс завершения -->
      <label class="subtask-checkbox" :title="checkboxTooltip">
        <input
          type="checkbox"
          :checked="subtask.isCompleted"
          @change="toggleComplete"
          :disabled="updating || loading"
        />
        <span class="checkmark">
          <Icon name="mdi:check" size="14" />
        </span>
      </label>
      
      <!-- Контент подзадачи -->
      <div class="subtask-content">
        <!-- Режим просмотра -->
        <template v-if="!isEditing">
          <div class="subtask-title-row">
            <span
              class="subtask-title"
              :class="{ completed: subtask.isCompleted }"
              @dblclick="startEditing"
            >
              {{ subtask.title }}
            </span>
            <!-- Кнопки действий (показываются при hover) -->
            <div class="subtask-actions">
              <button
                class="action-btn"
                @click="startEditing"
                title="Редактировать"
                :disabled="updating || loading"
              >
                <Icon name="mdi:pencil" size="14" />
              </button>
              <button
                v-if="canAddChild"
                class="action-btn"
                @click="showAddChildForm = true"
                title="Добавить подзадачу"
                :disabled="updating || loading"
              >
                <Icon name="mdi:plus" size="14" />
              </button>
              <button
                class="action-btn btn-danger"
                @click="handleDelete"
                title="Удалить"
                :disabled="updating || loading"
              >
                <Icon name="mdi:delete" size="14" />
              </button>
            </div>
          </div>
          
          <!-- Описание подзадачи -->
          <p v-if="subtask.description" class="subtask-description">
            {{ subtask.description }}
          </p>
          
          <!-- Индикатор дочерних подзадач -->
          <div v-if="hasChildren" class="children-indicator">
            <Icon name="mdi:chevron-down" size="14" />
            <span>{{ childrenCount }} {{ declension(childrenCount, ['подзадача', 'подзадачи', 'подзадач']) }}</span>
            <span v-if="completedChildrenCount > 0" class="children-completed">
              ({{ completedChildrenCount }} завершено)
            </span>
          </div>
        </template>
        
        <!-- Режим редактирования -->
        <template v-else>
          <div class="subtask-edit-form">
            <input
              ref="titleInputRef"
              v-model="editData.title"
              type="text"
              class="form-control"
              placeholder="Название подзадачи"
              @keyup.enter="saveEdit"
              @keyup.esc="cancelEdit"
            />
            <textarea
              v-model="editData.description"
              class="form-control textarea"
              placeholder="Описание (необязательно)"
              rows="2"
              @keyup.esc="cancelEdit"
            ></textarea>
            <div class="edit-actions">
              <button
                class="btn btn-sm btn-secondary"
                @click="cancelEdit"
                :disabled="updating || loading"
              >
                Отмена
              </button>
              <button
                class="btn btn-sm btn-primary"
                @click="saveEdit"
                :disabled="updating || loading || !canSave"
              >
                <Icon v-if="updating || loading" name="mdi:loading" size="14" class="spin" />
                <Icon v-else name="mdi:check" size="14" />
                {{ updating || loading ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
    
    <!-- Форма добавления дочерней подзадачи -->
    <Transition name="form-slide">
      <div v-if="showAddChildForm" class="child-add-form">
        <div class="form-header">
          <Icon name="mdi:plus-circle" size="16" />
          <span>Добавить подзадачу</span>
        </div>
        <input
          ref="childTitleInputRef"
          v-model="childData.title"
          type="text"
          class="form-control"
          placeholder="Название подзадачи..."
          @keyup.enter="addChild"
          @keyup.esc="cancelAddChild"
          autofocus
        />
        <textarea
          v-model="childData.description"
          class="form-control textarea"
          placeholder="Описание (необязательно)"
          rows="2"
        ></textarea>
        <div class="child-add-actions">
          <button
            class="btn btn-sm btn-secondary"
            @click="cancelAddChild"
            :disabled="addingChild || loading"
          >
            Отмена
          </button>
          <button
            class="btn btn-sm btn-primary"
            @click="addChild"
            :disabled="addingChild || loading || !canAddChildSubmit"
          >
            <Icon v-if="addingChild || loading" name="mdi:loading" size="14" class="spin" />
            <Icon v-else name="mdi:check" size="14" />
            {{ addingChild || loading ? 'Добавление...' : 'Добавить' }}
          </button>
        </div>
      </div>
    </Transition>
    
    <!-- Дочерние подзадачи -->
    <Transition name="children-expand">
      <div v-if="hasChildren && !subtask.isCompleted" class="subtask-children">
        <SubtaskItem
          v-for="child in subtask.children"
            :key="child.id"
            :subtask="child"
            :task-id="taskId"
            :depth="(depth ?? 0) + 1"
            @updated="$emit('updated')"
            @deleted="$emit('deleted')"
          />
        </div>
      </div>
    </Transition>
    
    <!-- Модалка подтверждения удаления -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
          <div class="modal modal-sm" @click.stop>
            <div class="modal-header">
              <h3>
                <Icon name="mdi:alert-circle" size="24" class="warning-icon" />
                Удаление подзадачи
              </h3>
              <button class="modal-close" @click="cancelDelete">
                <Icon name="mdi:close" size="24" />
              </button>
            </div>
            <div class="modal-body">
              <p class="delete-warning">
                Вы уверены, что хотите удалить подзадачу
                <strong>"{{ truncateText(subtask.title, 50) }}"</strong>?
              </p>
              <div v-if="hasChildren" class="delete-info-box">
                <Icon name="mdi:information" size="20" class="info-icon" />
                <p class="delete-info">
                  Все {{ childrenCount }} дочерние подзадачи также будут удалены.
                </p>
              </div>
              <p class="delete-info">
                Это действие нельзя отменить.
              </p>
            </div>
            <div class="modal-actions">
              <button
                class="btn btn-secondary"
                @click="cancelDelete"
                :disabled="deleting || loading"
              >
                Отмена
              </button>
              <button
                class="btn btn-danger"
                @click="deleteSubtask"
                :disabled="deleting || loading"
              >
                <Icon v-if="deleting || loading" name="mdi:loading" size="16" class="spin" />
                {{ deleting || loading ? 'Удаление...' : 'Удалить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useSubtasks } from '~/composables/boards/useSubtasks'
import { useSubtaskCompletion } from '~/composables/boards/useSubtaskCompletion'
import { useNotifications } from '~/composables/useNotifications'
import type { SubtaskTree } from '~/types/boards'  // ✅ ИСПРАВЛЕНО: SubtaskTree вместо Subtask
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  subtask: SubtaskTree  // ✅ ИСПРАВЛЕНО: SubtaskTree вместо Subtask
  taskId: number
  depth?: number  // ✅ Опциональный, будет значение по умолчанию
}>()

const emit = defineEmits<{
  updated: []
  deleted: []
}>()

// ============================================
// COMPOSABLES
// ============================================
const { updateSubtask, completeSubtask, deleteSubtask, createSubtask } = useSubtasks()
const { toggleComplete: toggleCompleteWithChildren } = useSubtaskCompletion(props.taskId)
const notifications = useNotifications()

// ✅ УБРАНО: subscribeToTask, unsubscribeFromTask (теперь подписка в родительском компоненте)

// ============================================
// STATE
// ============================================
const isEditing = ref(false)
const showAddChildForm = ref(false)
const showDeleteConfirm = ref(false)
const updating = ref(false)
const addingChild = ref(false)
const deleting = ref(false)
const loading = ref(false)
const isDragging = ref(false)
const isDropTarget = ref(false)
const dropPosition = ref<'above' | 'below' | 'child' | null>(null)
const titleInputRef = ref<HTMLInputElement | null>(null)
const childTitleInputRef = ref<HTMLInputElement | null>(null)
const editData = ref({
  title: props.subtask.title,
  description: props.subtask.description || ''
})
const childData = ref({
  title: '',
  description: ''
})

// ============================================
// COMPUTED
// ============================================
const hasChildren = computed(() => {
  return props.subtask.children && props.subtask.children.length > 0  // ✅ children вместо subtasks
})

const childrenCount = computed(() => {
  if (!props.subtask.children) return 0  // ✅ children вместо subtasks
  return countAllChildren(props.subtask.children)  // ✅ children вместо subtasks
})

const completedChildrenCount = computed(() => {
  if (!props.subtask.children) return 0  // ✅ children вместо subtasks
  return countCompletedChildren(props.subtask.children)  // ✅ children вместо subtasks
})

const canAddChild = computed(() => {
  return (props.depth ?? 0) < MAX_SUBTASK_DEPTH  // ✅ depth ?? 0
})

const canAddChildSubmit = computed(() => {
  return childData.value.title.trim().length > 0
})

const canSave = computed(() => {
  return editData.value.title.trim().length > 0 &&
         editData.value.title.trim() !== props.subtask.title
})

const checkboxTooltip = computed(() => {
  if (hasChildren.value) {
    return props.subtask.isCompleted
      ? 'Развернуть (дочерние будут развернуты)'
      : 'Завершить (дочерние будут завершены)'
  }
  return props.subtask.isCompleted ? 'Развернуть' : 'Завершить'
})

// ============================================
// METHODS - Подсчёт детей
// ============================================
const countAllChildren = (children: SubtaskTree[]): number => {
  let count = children.length
  children.forEach(child => {
    if (child.children && child.children.length > 0) {  // ✅ children вместо subtasks
      count += countAllChildren(child.children)  // ✅ children вместо subtasks
    }
  })
  return count
}

const countCompletedChildren = (children: SubtaskTree[]): number => {
  let count = children.filter(c => c.isCompleted).length
  children.forEach(child => {
    if (child.children && child.children.length > 0) {  // ✅ children вместо subtasks
      count += countCompletedChildren(child.children)  // ✅ children вместо subtasks
    }
  })
  return count
}

// ============================================
// METHODS - Завершение подзадачи
// ============================================
const toggleComplete = async () => {
  loading.value = true
  try {
    await toggleCompleteWithChildren(props.subtask.id, props.subtask.isCompleted)
    notifications.success(
      props.subtask.isCompleted ? 'Подзадача развернута' : 'Подзадача завершена'
    )
    emit('updated')
  } catch (error: any) {
    console.error('Failed to toggle subtask:', error)
    const message = error.data?.message || 'Не удалось изменить статус подзадачи'
    notifications.error(message)
  } finally {
    loading.value = false
  }
}

// ============================================
// METHODS - Редактирование
// ============================================
const startEditing = async () => {
  editData.value = {
    title: props.subtask.title,
    description: props.subtask.description || ''
  }
  isEditing.value = true
  await nextTick()
  if (titleInputRef.value) {
    titleInputRef.value.focus()
    titleInputRef.value.select()
  }
}

const cancelEdit = () => {
  isEditing.value = false
  editData.value = {
    title: props.subtask.title,
    description: props.subtask.description || ''
  }
}

const saveEdit = async () => {
  if (!canSave.value) {
    cancelEdit()
    return
  }
  updating.value = true
  try {
    await updateSubtask(props.subtask.id, {
      title: editData.value.title.trim(),
      description: editData.value.description.trim() || undefined
    })
    notifications.success('Подзадача обновлена')
    emit('updated')
    cancelEdit()
  } catch (error: any) {
    console.error('Failed to update subtask:', error)
    const message = error.data?.message || 'Не удалось сохранить подзадачу'
    notifications.error(message)
  } finally {
    updating.value = false
  }
}

// ============================================
// METHODS - Дочерние подзадачи
// ============================================
const addChild = async () => {
  if (!canAddChildSubmit.value) return
  addingChild.value = true
  try {
    await createSubtask(props.taskId, {
      title: childData.value.title.trim(),
      description: childData.value.description.trim() || undefined,
      parentId: props.subtask.id,
      order: 0
    })
    notifications.success('Подзадача добавлена')
    emit('updated')
    cancelAddChild()
  } catch (error: any) {
    console.error('Failed to create child subtask:', error)
    const message = error.data?.message || 'Не удалось добавить подзадачу'
    notifications.error(message)
  } finally {
    addingChild.value = false
  }
}

const cancelAddChild = () => {
  showAddChildForm.value = false
  childData.value = { title: '', description: '' }
}

// ============================================
// METHODS - Удаление
// ============================================
const handleDelete = async () => {
  if (!confirm('Удалить эту подзадачу?')) return
  deleting.value = true
  try {
    await deleteSubtask(props.subtask.id)
    notifications.success('Подзадача удалена')
    emit('deleted')
  } catch (error: any) {
    console.error('Failed to delete subtask:', error)
    const message = error.data?.message || 'Не удалось удалить подзадачу'
    notifications.error(message)
  } finally {
    deleting.value = false
  }
}

// ============================================
// METHODS - Drag & Drop
// ============================================
const handleDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return
  isDragging.value = true
  const dragData = {
    type: 'subtask',
    subtaskId: props.subtask.id,
    taskId: props.taskId,
    parentId: props.subtask.parentId
  }
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'move'
  const target = event.target as HTMLElement
  if (target.classList.contains('subtask-item')) {
    target.style.opacity = '0.5'
    target.style.transform = 'scale(1.02)'
  }
}

const handleDragEnd = (event: DragEvent) => {
  isDragging.value = false
  isDropTarget.value = false
  dropPosition.value = null
  const target = event.target as HTMLElement
  if (target.classList.contains('subtask-item')) {
    target.style.opacity = '1'
    target.style.transform = 'scale(1)'
  }
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!event.dataTransfer) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const mouseY = event.clientY
  const elementCenterY = rect.top + rect.height / 2
  const threshold = rect.height * 0.25
  if (mouseY < elementCenterY - threshold) {
    dropPosition.value = 'above'
  } else if (mouseY > elementCenterY + threshold) {
    dropPosition.value = 'below'
  } else {
    dropPosition.value = 'child'
  }
  isDropTarget.value = true
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDropTarget.value = true
}

const handleDragLeave = (event: DragEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const currentTarget = event.currentTarget as HTMLElement | null
  if (!relatedTarget || !currentTarget || !currentTarget.contains(relatedTarget)) {
    isDropTarget.value = false
    dropPosition.value = null
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  if (!event.dataTransfer) return
  try {
    const data = event.dataTransfer.getData('application/json')
    const dragData = JSON.parse(data)
    if (dragData.type !== 'subtask') return
    if (dragData.subtaskId === props.subtask.id) return
    if (isDescendant(props.subtask, dragData.subtaskId)) {
      notifications.warning('Нельзя переместить подзадачу в себя или своего потомка')
      resetDragState()
      return
    }
    if (dropPosition.value === 'above') {
      await moveSubtaskAbove(dragData.subtaskId, props.subtask.id)
    } else if (dropPosition.value === 'below') {
      await moveSubtaskBelow(dragData.subtaskId, props.subtask.id)
    } else if (dropPosition.value === 'child') {
      await moveSubtaskAsChild(dragData.subtaskId, props.subtask.id)
    }
    notifications.success('Подзадача перемещена')
    emit('updated')
  } catch (error: any) {
    console.error('Failed to move subtask:', error)
    const message = error.data?.message || 'Не удалось переместить подзадачу'
    notifications.error(message)
  } finally {
    resetDragState()
  }
}

const resetDragState = () => {
  isDragging.value = false
  isDropTarget.value = false
  dropPosition.value = null
}

// ============================================
// METHODS - Вспомогательные
// ============================================
const isDescendant = (parent: SubtaskTree, targetId: number): boolean => {
  if (!parent.children || parent.children.length === 0) return false  // ✅ children вместо subtasks
  for (const child of parent.children) {  // ✅ children вместо subtasks
    if (child.id === targetId) return true
    if (isDescendant(child, targetId)) return true
  }
  return false
}

const moveSubtaskAbove = async (sourceId: number, targetId: number) => {
  await updateSubtask(sourceId, {
    parentId: props.subtask.parentId,
    order: props.subtask.order
  })
}

const moveSubtaskBelow = async (sourceId: number, targetId: number) => {
  await updateSubtask(sourceId, {
    parentId: props.subtask.parentId,
    order: props.subtask.order + 1
  })
}

const moveSubtaskAsChild = async (sourceId: number, parentId: number) => {
  await updateSubtask(sourceId, {
    parentId,
    order: 0
  })
}

const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const declension = (number: number, titles: string[]): string => {
  const cases = [2, 0, 1, 1, 1, 2]
  return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]]
}

// ============================================
// WATCHERS
// ============================================
watch(() => props.subtask.title, (newTitle) => {
  if (!isEditing.value) {
    editData.value.title = newTitle
  }
})

watch(() => props.subtask.description, (newDesc) => {
  if (!isEditing.value) {
    editData.value.description = newDesc || ''
  }
})

// ============================================
// LIFECYCLE
// ============================================
// ✅ УБРАНО: onMounted/onUnmounted с подпиской на сокет
// Подписка на обновления доски происходит в родительском компоненте (Subtasks/index.vue)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

// ============================================
// ОСНОВНЫЕ СТИЛИ
// ============================================
.subtask-item {
  position: relative;
  padding: 12px 0;
  border-bottom: 1px solid #334155;
  transition: all 0.2s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.completed {
    opacity: 0.7;
    
    .subtask-title {
      color: #64748b;
      text-decoration: line-through;
    }
    
    .subtask-description {
      color: #475569;
    }
  }
  
  &.dragging {
    opacity: 0.5;
    transform: scale(1.02);
  }
  
  &.drop-target {
    &.drop-above::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, $blue, transparent);
      border-radius: 2px;
      animation: pulse 1.5s infinite;
    }
    
    &.drop-below::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, $blue, transparent);
      border-radius: 2px;
      animation: pulse 1.5s infinite;
    }
    
    &.drop-child {
      background: rgba($blue, 0.1);
      border-left: 3px solid $blue;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

// ============================================
// ИНДИКАТОР ГЛУБИНЫ
// ============================================
.depth-indicator {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #334155;
  
  &:last-child {
    background: transparent;
  }
}

// ============================================
// ОСНОВНАЯ СТРОКА
// ============================================
.subtask-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding-left: 8px;
}

// ============================================
// ЧЕКБОКС
// ============================================
.subtask-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 2px;
  cursor: pointer;
  
  input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    width: 0;
    height: 0;
    
    &:checked ~ .checkmark {
      background: $green;
      border-color: $green;
      
      .icon {
        display: block;
      }
    }
    
    &:disabled ~ .checkmark {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  
  .checkmark {
    position: relative;
    width: 20px;
    height: 20px;
    background: #1e293b;
    border: 2px solid #475569;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    .icon {
      display: none;
      color: $text-light;
    }
    
    &:hover {
      border-color: $blue;
    }
  }
}

// ============================================
// КОНТЕНТ
// ============================================
.subtask-content {
  flex: 1;
  min-width: 0;
}

.subtask-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 4px;
}

.subtask-title {
  font-size: 14px;
  font-weight: 500;
  color: $text-light;
  line-height: 1.5;
  word-break: break-word;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    color: $blue;
  }
  
  &.completed {
    color: #64748b;
    text-decoration: line-through;
  }
}

.subtask-description {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0 0 8px 0;
  word-break: break-word;
}

.children-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
  margin-top: 6px;
  
  .icon {
    color: #475569;
  }
  
  .children-completed {
    color: $green;
  }
}

// ============================================
// КНОПКИ ДЕЙСТВИЙ
// ============================================
.subtask-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .subtask-item:hover & {
    opacity: 1;
  }
}

.action-btn {
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
  
  &:hover:not(:disabled) {
    background: #334155;
    color: $text-light;
  }
  
  &.btn-danger {
    &:hover:not(:disabled) {
      background: rgba($red, 0.15);
      color: $red;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// ============================================
// ФОРМА РЕДАКТИРОВАНИЯ
// ============================================
.subtask-edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: $text-light;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.1);
  }
  
  &::placeholder {
    color: #64748b;
  }
  
  &.textarea {
    resize: vertical;
    min-height: 60px;
  }
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #334155;
}

// ============================================
// ФОРМА ДОБАВЛЕНИЯ ДОЧЕРНЕЙ
// ============================================
.child-add-form {
  margin-top: 12px;
  padding: 12px;
  background: rgba($blue, 0.05);
  border: 1px solid rgba($blue, 0.2);
  border-radius: 8px;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: $blue;
  margin-bottom: 10px;
}

.child-add-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #334155;
}

// ============================================
// ДОЧЕРНИЕ ПОДЗАДАЧИ
// ============================================
.subtask-children {
  margin-top: 12px;
  padding-left: 32px;
  border-left: 2px solid #334155;
}

// ============================================
// КНОПКИ
// ============================================
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
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
  padding: 6px 12px;
  font-size: 12px;
}

.btn-primary {
  background: $blue;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: color.adjust($blue, $lightness: 5%);
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

.btn-danger {
  background: rgba($red, 0.15);
  color: $red;
  border: 1px solid rgba($red, 0.3);
  
  &:hover:not(:disabled) {
    background: rgba($red, 0.25);
  }
}

// ============================================
// МОДАЛКА
// ============================================
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
  max-width: 400px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  
  &.modal-sm {
    max-width: 380px;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #334155;
  
  h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: $text-light;
    
    .warning-icon {
      color: $red;
    }
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

.delete-warning {
  margin: 0 0 16px 0;
  color: $text-light;
  font-size: 15px;
  line-height: 1.5;
  
  strong {
    color: $blue;
  }
}

.delete-info-box {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: rgba($yellow, 0.1);
  border: 1px solid rgba($yellow, 0.3);
  border-radius: 8px;
  margin-bottom: 12px;
  
  .info-icon {
    color: $yellow;
    flex-shrink: 0;
    margin-top: 2px;
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

// ============================================
// АНИМАЦИИ
// ============================================
.form-slide-enter-active,
.form-slide-leave-active {
  transition: all 0.2s ease;
}

.form-slide-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.form-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.children-expand-enter-active,
.children-expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.children-expand-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.children-expand-leave-to {
  opacity: 0;
  transform: translateY(-10px);
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

// ============================================
// АДАПТИВНОСТЬ
// ============================================
@media (max-width: 768px) {
  .subtask-actions {
    opacity: 1;
  }
  
  .subtask-children {
    padding-left: 20px;
  }
  
  .subtask-title-row {
    flex-wrap: wrap;
  }
}
</style>