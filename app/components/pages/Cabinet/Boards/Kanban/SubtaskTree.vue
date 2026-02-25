<!-- app/components/pages/cabinet/Boards/Kanban/SubtaskTree.vue -->
 <template>
<div class="subtask-tree">
  <div
    v-for="subtask in subtasks"
    :key="subtask.id"
    class="subtask-item"
    :class="{
      'dragging': draggingSubtaskId === subtask.id,
      'drop-above': dragTargetSubtaskId === subtask.id && dragPosition === 'above',
      'drop-below': dragTargetSubtaskId === subtask.id && dragPosition === 'below',
      'drop-child': dragTargetSubtaskId === subtask.id && dragPosition === 'child'
    }"
    draggable="true"
    @dragstart="handleSubtaskDragStart($event, subtask)"
    @dragend="handleSubtaskDragEnd"
    @dragover.prevent="handleSubtaskDragOver($event, subtask)"
    @dragenter.prevent="handleSubtaskDragEnter($event, subtask)"
    @dragleave="handleSubtaskDragLeave($event, subtask)"
    @drop.prevent="handleSubtaskDrop($event, subtask)"
  >
    <div class="subtask-header">
      <label class="subtask-checkbox">
        <input
          type="checkbox"
          :checked="subtask.isCompleted"
          @change="toggleSubtask(subtask.id)"
        />
        <span class="checkmark"></span>
      </label>
      
      <div class="subtask-content">
        <div class="subtask-title-wrapper">
          <span :class="subtask.isCompleted ? 'subtask-title completed' : 'subtask-title'">
            {{ subtask.title }}
          </span>
          
          <span v-if="subtask.description" class="subtask-description">
            {{ truncateText(subtask.description, 60) }}
          </span>
        </div>
        
        <div class="subtask-actions">
          <button class="btn btn-sm btn-text" @click="toggleEdit(subtask.id)" title="Редактировать">
            ✏️
          </button>
          <button class="btn btn-sm btn-text" @click="showAddChild(subtask.id)" title="Добавить подзадачу">
            +
          </button>
          <button class="btn btn-sm btn-text" @click="deleteSubtask(subtask.id)" title="Удалить">
            🗑️
          </button>
        </div>
      </div>
    </div>
    
    <!-- Форма редактирования -->
    <div v-if="editingSubtask === subtask.id" class="subtask-edit-form">
      <input
        v-model="editedSubtask.title"
        type="text"
        class="form-control"
        placeholder="Название подзадачи"
      />
      <textarea
        v-model="editedSubtask.description"
        class="form-control"
        placeholder="Описание (необязательно)"
        rows="2"
      ></textarea>
      <div class="subtask-edit-actions">
        <button class="btn btn-secondary" @click="cancelEdit">
          Отмена
        </button>
        <button class="btn btn-primary" @click="saveEdit(subtask.id)">
          Сохранить
        </button>
      </div>
    </div>
    
    <!-- Форма добавления дочерней подзадачи -->
    <div v-if="addChildTo === subtask.id" class="subtask-add-form">
      <input
        v-model="newChildSubtask.title"
        type="text"
        class="form-control"
        placeholder="Название подзадачи"
        @keyup.enter="addChildSubtask(subtask.id)"
      />
      <div class="subtask-add-actions">
        <button class="btn btn-secondary" @click="addChildTo = null">
          Отмена
        </button>
        <button class="btn btn-primary" @click="addChildSubtask(subtask.id)">
          Добавить
        </button>
      </div>
    </div>
    
    <!-- Дочерние подзадачи -->
    <div
      v-if="subtask.subtasks && subtask.subtasks.length > 0"
      class="subtask-children"
      @dragover.prevent="handleChildDragOver($event, subtask)"
      @dragenter.prevent
      @drop.prevent="handleChildDrop($event, subtask)"
    >
      <SubtaskTree
        :subtasks="subtask.subtasks"
        :task-id="taskId"
        @subtask-updated="$emit('subtaskUpdated')"
      />
    </div>
  </div>
</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSubtasks } from '~/composables/boards/useSubtasks'
import { useNotifications } from '~/composables/useNotifications'
import type { Subtask } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  subtasks: Subtask[]
  taskId: number
}>()

const emit = defineEmits<{
  subtaskUpdated: []
}>()

// ============================================
// COMPOSABLES
// ============================================
const { createSubtask, updateSubtask, subscribeToTask, unsubscribeFromTask } = useSubtasks()
const notifications = useNotifications()

// ============================================
// DRAG & DROP STATE
// ============================================
const draggingSubtaskId = ref<number | null>(null)
const dragTargetSubtaskId = ref<number | null>(null)
const dragPosition = ref<'above' | 'below' | 'child' | null>(null)

// ============================================
// STATE
// ============================================
const editingSubtask = ref<number | null>(null)
const addChildTo = ref<number | null>(null)
const editedSubtask = ref({
  title: '',
  description: ''
})
const newChildSubtask = ref({
  title: ''
})

// ============================================
// METHODS
// ============================================
const toggleSubtask = async (id: number) => {
  try {
    await updateSubtask(id, {
      isCompleted: !findSubtask(props.subtasks, id)?.isCompleted
    })
    emit('subtaskUpdated')
  } catch (error) {
    console.error('Failed to toggle subtask:', error)
    notifications.error('Не удалось обновить статус подзадачи')
  }
}

const toggleEdit = (id: number) => {
  const subtask = findSubtask(props.subtasks, id)
  if (subtask) {
    editedSubtask.value = {
      title: subtask.title,
      description: subtask.description || ''
    }
    editingSubtask.value = id
  }
}

const cancelEdit = () => {
  editingSubtask.value = null
  editedSubtask.value = { title: '', description: '' }
}

const saveEdit = async (id: number) => {
  if (!editedSubtask.value.title.trim()) {
    notifications.warning('Название подзадачи не может быть пустым')
    return
  }
  
  try {
    await updateSubtask(id, {
      title: editedSubtask.value.title.trim(),
      description: editedSubtask.value.description.trim() || null
    })
    cancelEdit()
    emit('subtaskUpdated')
    notifications.success('Подзадача обновлена')
  } catch (error) {
    console.error('Failed to save subtask:', error)
    notifications.error('Не удалось сохранить подзадачу')
  }
}

const showAddChild = (id: number) => {
  addChildTo.value = id
  newChildSubtask.value = { title: '' }
}

const addChildSubtask = async (parentId: number) => {
  const title = newChildSubtask.value.title.trim()
  if (!title) {
    notifications.warning('Введите название подзадачи')
    return
  }
  
  try {
    await createSubtask(props.taskId, {
      title: title,
      description: '',
      parentId: parentId,
      order: 0
    })
    addChildTo.value = null
    newChildSubtask.value = { title: '' }
    emit('subtaskUpdated')
    notifications.success('Подзадача добавлена')
  } catch (error) {
    console.error('Failed to create subtask:', error)
    notifications.error('Не удалось добавить подзадачу')
  }
}

const deleteSubtask = async (id: number) => {
  if (confirm('Удалить подзадачу?')) {
    try {
      await updateSubtask(id, { parentId: null }) // Сначала удаляем связь
      emit('subtaskUpdated')
      notifications.success('Подзадача удалена')
    } catch (error) {
      console.error('Failed to delete subtask:', error)
      notifications.error('Не удалось удалить подзадачу')
    }
  }
}

const truncateText = (text: string, maxLength: number) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const findSubtask = (subtasks: Subtask[], id: number): Subtask | null => {
  for (const subtask of subtasks) {
    if (subtask.id === id) return subtask
    if (subtask.subtasks && subtask.subtasks.length > 0) {
      const found = findSubtask(subtask.subtasks, id)
      if (found) return found
    }
  }
  return null
}

// ============================================
// DRAG & DROP METHODS
// ============================================
const handleSubtaskDragStart = (event: DragEvent, subtask: Subtask) => {
  if (!event.dataTransfer) return
  
  draggingSubtaskId.value = subtask.id
  
  const dragData = {
    type: 'subtask',
    subtaskId: subtask.id,
    taskId: props.taskId,
    parentId: subtask.parentId
  }
  
  event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  event.dataTransfer.effectAllowed = 'move'
  
  const target = event.target as HTMLElement
  target.style.opacity = '0.7'
  target.style.transform = 'scale(1.05)'
}

const handleSubtaskDragEnd = (event: DragEvent) => {
  draggingSubtaskId.value = null
  const target = event.target as HTMLElement
  target.style.opacity = '1'
  target.style.transform = 'scale(1)'
}

const handleSubtaskDragOver = (event: DragEvent, targetSubtask: Subtask) => {
  event.preventDefault()
  
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const mouseY = event.clientY
  const elementCenterY = rect.top + rect.height / 2
  
  if (mouseY < elementCenterY - 20) {
    dragPosition.value = 'above'
  } else if (mouseY > elementCenterY + 20) {
    dragPosition.value = 'below'
  } else {
    dragPosition.value = 'child'
  }
  
  dragTargetSubtaskId.value = targetSubtask.id
}

const handleSubtaskDragEnter = (event: DragEvent, targetSubtask: Subtask) => {
  event.preventDefault()
  dragTargetSubtaskId.value = targetSubtask.id
}

const handleSubtaskDragLeave = (event: DragEvent, targetSubtask: Subtask) => {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const currentTarget = event.currentTarget as HTMLElement | null
  
  if (!relatedTarget || !currentTarget || !currentTarget.contains(relatedTarget)) {
    dragTargetSubtaskId.value = null
    dragPosition.value = null
  }
}

const handleChildDragOver = (event: DragEvent, parentSubtask: Subtask) => {
  event.preventDefault()
  dragTargetSubtaskId.value = parentSubtask.id
  dragPosition.value = 'child'
}

const handleChildDrop = async (event: DragEvent, parentSubtask: Subtask) => {
  event.stopPropagation()
  if (!draggingSubtaskId.value) return
  
  try {
    await updateSubtask(draggingSubtaskId.value, {
      parentId: parentSubtask.id,
      order: 0
    })
    emit('subtaskUpdated')
    notifications.success('Подзадача перемещена как дочерняя')
  } catch (error) {
    console.error('Failed to move subtask:', error)
    notifications.error('Не удалось переместить подзадачу')
  } finally {
    resetDragState()
  }
}

const handleSubtaskDrop = async (event: DragEvent, targetSubtask: Subtask) => {
  if (!draggingSubtaskId.value || draggingSubtaskId.value === targetSubtask.id) {
    resetDragState()
    return
  }
  
  try {
    const sourceSubtask = findSubtask(props.subtasks, draggingSubtaskId.value)
    if (!sourceSubtask) {
      resetDragState()
      return
    }
    
    // Проверяем циклическую зависимость
    if (isDescendant(targetSubtask, draggingSubtaskId.value)) {
      notifications.warning('Нельзя переместить подзадачу в себя или своего потомка')
      resetDragState()
      return
    }
    
    // Обрабатываем разные позиции вставки
    if (dragPosition.value === 'above') {
      await moveSubtaskAbove(draggingSubtaskId.value, targetSubtask.id)
    } else if (dragPosition.value === 'below') {
      await moveSubtaskBelow(draggingSubtaskId.value, targetSubtask.id)
    } else if (dragPosition.value === 'child') {
      await moveSubtaskAsChild(draggingSubtaskId.value, targetSubtask.id)
    }
    
    emit('subtaskUpdated')
    notifications.success('Подзадача перемещена')
  } catch (error) {
    console.error('Failed to move subtask:', error)
    notifications.error('Не удалось переместить подзадачу')
  } finally {
    resetDragState()
  }
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
// ============================================
const isDescendant = (parent: Subtask, targetId: number): boolean => {
  if (!parent.subtasks || parent.subtasks.length === 0) return false
  
  for (const child of parent.subtasks) {
    if (child.id === targetId) return true
    if (isDescendant(child, targetId)) return true
  }
  
  return false
}

const moveSubtaskAbove = async (sourceId: number, targetId: number) => {
  const targetIndex = findSubtaskIndex(props.subtasks, targetId)
  if (targetIndex === -1) throw new Error('Target subtask not found')
  
  await updateSubtask(sourceId, {
    parentId: null,
    order: targetIndex
  })
}

const moveSubtaskBelow = async (sourceId: number, targetId: number) => {
  const targetIndex = findSubtaskIndex(props.subtasks, targetId)
  if (targetIndex === -1) throw new Error('Target subtask not found')
  
  await updateSubtask(sourceId, {
    parentId: null,
    order: targetIndex + 1
  })
}

const moveSubtaskAsChild = async (sourceId: number, parentId: number) => {
  await updateSubtask(sourceId, {
    parentId: parentId,
    order: 0
  })
}

const findSubtaskIndex = (subtasks: Subtask[], id: number, parentId: number | null = null): number => {
  let index = 0
  
  for (const subtask of subtasks) {
    if (subtask.parentId === parentId) {
      if (subtask.id === id) return index
      index++
    }
    
    if (subtask.subtasks && subtask.subtasks.length > 0) {
      const childIndex = findSubtaskIndex(subtask.subtasks, id, subtask.id)
      if (childIndex !== -1) return childIndex
    }
  }
  
  return -1
}

const resetDragState = () => {
  draggingSubtaskId.value = null
  dragTargetSubtaskId.value = null
  dragPosition.value = null
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  subscribeToTask(props.taskId)
})

onUnmounted(() => {
  unsubscribeFromTask(props.taskId)
})
</script>

<style scoped lang="scss">
.subtask-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subtask-item {
  position: relative;
  transition: all 0.2s ease;
  
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
    
    .subtask-children {
      background: rgba($blue, 0.05);
      border-left: 2px dashed $blue;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.subtask-children {
  position: relative;
  margin-top: 8px;
  padding-left: 24px;
  border-left: 2px solid #334155;
  
  &::before {
    content: '';
    position: absolute;
    left: -2px;
    top: 0;
    bottom: 0;
    width: 100%;
    background: transparent;
    transition: background 0.2s ease;
  }
}

.subtask-header {
  display: flex;
  gap: 12px;
}

.subtask-checkbox {
  position: relative;
  display: inline-block;
  width: 20px;
  height: 20px;
  cursor: pointer;
}

.subtask-checkbox input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 20px;
  width: 20px;
  background-color: #334155;
  border-radius: 4px;
  border: 2px solid #4b5563;
  transition: all 0.2s ease;
}

.subtask-checkbox input:checked ~ .checkmark {
  background-color: $green;
  border-color: $green;
}

.checkmark:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.subtask-checkbox input:checked ~ .checkmark:after {
  display: block;
}

.subtask-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.subtask-title-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.subtask-title {
  font-size: 15px;
  font-weight: 500;
  color: $text-light;
  word-break: break-word;
}

.subtask-title.completed {
  color: #64748b;
  text-decoration: line-through;
}

.subtask-description {
  font-size: 13px;
  color: #94a3b8;
  word-break: break-word;
}

.subtask-actions {
  display: flex;
  gap: 4px;
  margin-left: 12px;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 14px;
}

.btn-text {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #334155;
    color: $text-light;
  }
}

.subtask-edit-form,
.subtask-add-form {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  color: $text-light;
  font-size: 14px;
  margin-bottom: 8px;
  
  &:focus {
    outline: none;
    border-color: $blue;
  }
}

.subtask-edit-actions,
.subtask-add-actions {
  display: flex;
  gap: 8px;
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

span {
  color: unset;
}
</style>