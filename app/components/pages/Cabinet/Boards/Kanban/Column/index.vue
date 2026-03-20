<!-- app/components/pages/cabinet/Boards/Kanban/Column/index.vue -->
<template>
  <div
    class="column"
    :class="{ 'drag-over': isDraggingOver }"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- Шапка колонки -->
    <div class="column-header">
      <div class="column-title-wrapper">
        <h2 class="column-title">{{ column.name }}</h2>
        <span class="column-count">{{ tasks.length }}</span>
      </div>
      <div class="column-actions">
        <button
          class="column-add-btn-header"
          @click="toggleCreateForm"
          :class="{ active: showCreateForm }"
          title="Добавить задачу"
        >
          <Icon
            :name="showCreateForm ? 'mdi:close' : 'mdi:plus'"
            size="20"
            class="btn-icon"
            :class="{ 'icon-rotate': showCreateForm }"
          />
        </button>
        <button
          class="column-menu-btn"
          @click.stop="toggleColumnMenu($event)"
          title="Меню колонки"
        >
          <Icon name="mdi:dots-vertical" size="20" />
        </button>
      </div>
    </div>

    <!-- ✅ TELEPORT ДЛЯ МЕНЮ КОЛОНКИ -->
    <Teleport to="body">
      <Transition name="menu-fade">
        <div
          v-if="showColumnMenu"
          class="column-menu-dropdown"
          :style="{
            position: 'fixed',
            top: columnMenuPosition.top,
            right: columnMenuPosition.right,
            zIndex: 9999
          }"
          @click.stop
        >
          <button
            class="menu-item"
            @click.stop="startEditingColumnName"
          >
            <Icon name="mdi:pencil" size="16" />
            <span>Переименовать</span>
          </button>
          <button
            class="menu-item danger"
            @click.stop="confirmDeleteColumn"
          >
            <Icon name="mdi:delete" size="16" />
            <span>Удалить колонку</span>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- ✅ РЕЖИМ РЕДАКТИРОВАНИЯ НАЗВАНИЯ КОЛОНКИ -->
    <Transition name="form-slide">
      <div v-if="isEditingColumnName" class="column-name-edit">
        <input
          ref="columnNameInputRef"
          v-model="editedColumnName"
          type="text"
          class="form-control"
          placeholder="Название колонки..."
          maxlength="255"
          @keyup.enter="saveColumnName"
          @keyup.esc="cancelEditColumnName"
          @blur="onColumnNameBlur"
          autofocus
        />
        <div class="edit-actions">
          <button
            class="btn btn-sm btn-secondary"
            @click="cancelEditColumnName"
            :disabled="savingColumn"
          >
            Отмена
          </button>
          <button
            class="btn btn-sm btn-primary"
            @click="saveColumnName"
            :disabled="savingColumn || !canSaveColumnName"
          >
            <Icon v-if="savingColumn" name="mdi:loading" size="16" class="spin" />
            <Icon v-else name="mdi:check" size="16" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Форма создания задачи -->
    <Transition name="form-slide">
      <div v-if="showCreateForm" class="column-create-form">
        <div class="form-group">
          <input
            v-model="newTask.title"
            type="text"
            class="form-control"
            placeholder="Название задачи..."
            @keyup.enter="handleCreateTask"
            @keyup.esc="closeCreateForm"
            autofocus
          />
        </div>
        <div class="form-row">
          <select v-model="newTask.priority" class="form-control-select">
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
            <option value="urgent">Срочный</option>
          </select>
          <input
            v-model="newTask.dueDate"
            type="date"
            class="form-control-date"
            title="Срок выполнения (необязательно)"
          />
          <button
            class="btn btn-sm btn-primary"
            @click="handleCreateTask"
            :disabled="creatingTask || !canSubmit"
            title="Создать"
          >
            <Icon v-if="creatingTask" name="mdi:loading" size="16" class="spin" />
            <Icon v-else name="mdi:check" size="16" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Список задач -->
    <div class="column-body">
      <div v-if="tasks.length === 0 && !showCreateForm" class="column-empty">
        <Icon name="mdi:clipboard-text-off-outline" size="48" />
        <p>Нет задач</p>
      </div>
      <div v-else class="column-tasks">
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="task-wrapper"
          :class="{ 'drop-indicator': dropIndex === getTaskIndex(task) }"
        >
        <TaskCard
          :task="task"
          :board-id="boardId"
          :column-id="column.id"
        />
        </div>
        <div
          v-if="dropIndex !== null && dropIndex === sortedTasks.length"
          class="drop-indicator drop-indicator-end"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, shallowRef, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useTasksStore } from 'stores/boards/tasks'
import { useColumns } from '~/composables/boards/useColumns'
import { socketService } from 'services/socket.service'
import { useNotifications } from '~/composables/useNotifications'
import TaskCard from '../TaskCard.vue'
import type { Task, BoardColumn } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  boardId: number
  column: BoardColumn
  tasks: Task[]
}>()

const emit = defineEmits<{
  taskCreated: []
  columnUpdated: []
}>()

// ============================================
// STORES & COMPOSABLES
// ============================================
const tasksStore = useTasksStore()
const { updateColumn, deleteColumn } = useColumns()
const notifications = useNotifications()

// ============================================
// STATE — Форма создания задачи
// ============================================
const showCreateForm = ref(false)
const creatingTask = ref(false)
const newTask = ref({
  title: '',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  dueDate: ''
})

// ============================================
// STATE — Drag & Drop задач
// ============================================
const isDraggingOver = ref(false)
const dropIndex = ref<number | null>(null)
const tasksRef = shallowRef<Task[]>([...props.tasks])

// Обновляем shallowRef только если изменились ID или order
watch(() => props.tasks, (newTasks) => {
  const oldIds = tasksRef.value.map(t => `${t.id}-${t.order}`)
  const newIds = newTasks.map(t => `${t.id}-${t.order}`)
  if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
    tasksRef.value = [...newTasks]
  }
}, { deep: false })

// ============================================
// STATE — Редактирование названия колонки
// ============================================
const isEditingColumnName = ref(false)
const editedColumnName = ref('')
const savingColumn = ref(false)
const columnNameInputRef = ref<HTMLInputElement | null>(null)

const canSaveColumnName = computed(() => {
  return editedColumnName.value.trim().length > 0 &&
    editedColumnName.value.trim().length <= 255
})

// ============================================
// STATE — Меню колонки (Teleport)
// ============================================
const showColumnMenu = ref(false)
const columnMenuPosition = ref<{ top: string; right: string }>({
  top: '0px',
  right: '0px'
})

// ============================================
// COMPUTED
// ============================================
const canSubmit = computed(() => newTask.value.title.trim().length > 0)

const sortedTasks = computed(() => {
  return [...tasksRef.value].sort((a, b) => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    const aPriority = a.priority || 'low'
    const bPriority = b.priority || 'low'
    const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority]
    if (priorityDiff !== 0) return priorityDiff
    return (a.order ?? 0) - (b.order ?? 0)
  })
})

// ============================================
// METHODS - ФОРМА СОЗДАНИЯ ЗАДАЧИ
// ============================================
const toggleCreateForm = () => {
  showCreateForm.value = !showCreateForm.value
  if (showCreateForm.value) {
    newTask.value = { title: '', priority: 'medium', dueDate: '' }
    setTimeout(() => {
      const input = document.querySelector('.column-create-form input[type="text"]') as HTMLInputElement
      input?.focus()
    }, 100)
  }
}

const closeCreateForm = () => {
  showCreateForm.value = false
  newTask.value = { title: '', priority: 'medium', dueDate: '' }
}

const handleCreateTask = async () => {
  if (!canSubmit.value) return
  creatingTask.value = true
  try {
    await tasksStore.createTask(props.boardId, {
      title: newTask.value.title.trim(),
      description: '',
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate || null,
      columnId: props.column.id  // ✅ Передаём columnId вместо status
    })
    closeCreateForm()
    emit('taskCreated')
    notifications.success('Задача создана')
  } catch (err) {
    console.error('[Column] ❌ Failed to create task:', err)
    notifications.error('Не удалось создать задачу')
  } finally {
    creatingTask.value = false
  }
}

// ============================================
// METHODS - Вспомогательные
// ============================================
const getTaskIndex = (task: Task): number => {
  return sortedTasks.value.findIndex(t => t.id === task.id)
}

// ============================================
// DRAG & DROP - Определение позиции drop
// ============================================
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  const target = event.target as HTMLElement
  const taskElements = Array.from(
    target.closest('.column')?.querySelectorAll('.task-wrapper') || []
  )
  if (taskElements.length > 0) {
    const mouseY = event.clientY
    let closestIndex = 0
    let closestDistance = Infinity
    taskElements.forEach((el, index) => {
      const rect = el.getBoundingClientRect()
      const elementCenterY = rect.top + rect.height / 2
      const distance = Math.abs(mouseY - elementCenterY)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = mouseY > elementCenterY ? index + 1 : index
      }
    })
    dropIndex.value = closestIndex
  }
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDraggingOver.value = true
  dropIndex.value = null
}

const handleDragLeave = (event: DragEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  const currentTarget = event.currentTarget as HTMLElement | null
  if (!relatedTarget || !currentTarget || !currentTarget.contains(relatedTarget)) {
    isDraggingOver.value = false
    dropIndex.value = null
  }
}

// ============================================
// DRAG & DROP - Обработка drop
// ============================================
const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDraggingOver.value = false
  
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) {
      console.warn('[Column] No drag data found')
      return
    }
    
    const dragData = JSON.parse(data) as {
      type: string
      taskId: number
      columnId: number
    }
    
    if (dragData.type !== 'task' || !dragData.taskId) {
      console.warn('[Column] Invalid drag data:', dragData)
      return
    }
    
    const taskId = dragData.taskId
    const fromColumnId = dragData.columnId
    const toColumnId = props.column.id
    
    // ✅ СЛУЧАЙ 1: Перемещение между колонками
    if (fromColumnId !== toColumnId) {
      await tasksStore.updateTaskOptimistic(taskId, { columnId: toColumnId })
      await $fetch(`/api/boards/tasks/${taskId}`, {
        method: 'PUT',
        body: { columnId: toColumnId }
      })
    } 
    // ✅ СЛУЧАЙ 2: Перемещение внутри одной колонки (изменение order)
    else if (dropIndex.value !== null) {
      const currentOrder = props.tasks.findIndex(t => t.id === taskId)
      const newOrder = dropIndex.value
      if (currentOrder !== -1 && currentOrder !== newOrder) {
        const columnTasks = [...props.tasks]
        const spliced = columnTasks.splice(currentOrder, 1)
        const movedTask = spliced[0]
        if (movedTask === undefined) return
        columnTasks.splice(newOrder, 0, movedTask)
        const updates = columnTasks.map((task, index) => ({
          id: task.id,
          order: index
        }))
        const tasksList: Task[] = Array.isArray(tasksStore.tasks)
          ? (tasksStore.tasks as Task[])
          : []

        for (const update of updates) {
          const task = tasksList.find(t => t.id === update.id)
          if (task != null) {
            task.order = update.order
          }
        }
        await $fetch(`/api/boards/${props.boardId}/tasks/order`, {
          method: 'PUT',
          body: { updates }
        })
      }
    }
  } catch (error) {
    console.error('Failed to drop task:', error)
    notifications.error('Не удалось переместить задачу')
    await tasksStore.fetchTasks(props.boardId)
  } finally {
    dropIndex.value = null
  }
}

// ============================================
// METHODS - МЕНЮ КОЛОНКИ
// ============================================
const toggleColumnMenu = (event: MouseEvent) => {
  if (showColumnMenu.value) {
    showColumnMenu.value = false
    return
  }

  const trigger = event.currentTarget as HTMLElement
  const rect = trigger.getBoundingClientRect()

  columnMenuPosition.value = {
    top: `${rect.bottom + 8}px`,
    right: `${window.innerWidth - rect.right}px`
  }

  showColumnMenu.value = true
}

const closeColumnMenu = () => {
  showColumnMenu.value = false
}

// ============================================
// METHODS - РЕДАКТИРОВАНИЕ НАЗВАНИЯ КОЛОНКИ
// ============================================
const startEditingColumnName = async () => {
  editedColumnName.value = props.column.name
  isEditingColumnName.value = true
  closeColumnMenu()
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  if (columnNameInputRef.value && typeof columnNameInputRef.value.focus === 'function') {
    columnNameInputRef.value.focus()
    columnNameInputRef.value.select()
  }
}

const saveColumnName = async () => {
  if (!canSaveColumnName.value) return
  savingColumn.value = true
  try {
    await updateColumn(props.column.id, {
      name: editedColumnName.value.trim()
    })
    notifications.success('Колонка переименована')
    emit('columnUpdated')
    cancelEditColumnName()
  } catch (error: any) {
    console.error('Ошибка переименования колонки:', error)
    const message = error.data?.message || 'Не удалось переименовать колонку'
    notifications.error(message)
  } finally {
    savingColumn.value = false
  }
}

const cancelEditColumnName = () => {
  isEditingColumnName.value = false
  editedColumnName.value = ''
}

const onColumnNameBlur = async (e: FocusEvent) => {
  const relatedTarget = e.relatedTarget as HTMLElement | null
  if (!relatedTarget || !relatedTarget.classList.contains('btn')) {
    if (canSaveColumnName.value && editedColumnName.value.trim() !== '') {
      await saveColumnName()
    } else {
      cancelEditColumnName()
    }
  }
}

// ============================================
// METHODS - УДАЛЕНИЕ КОЛОНКИ
// ============================================
const confirmDeleteColumn = () => {
  if (confirm(`Вы уверены, что хотите удалить колонку "${props.column.name}"? Все задачи останутся без колонки.`)) {
    deleteColumn(props.column.id)
      .then(() => {
        notifications.success('Колонка удалена')
        emit('columnUpdated')
      })
      .catch((error: any) => {
        console.error('Ошибка удаления колонки:', error)
        const message = error.data?.message || 'Не удалось удалить колонку'
        notifications.error(message)
      })
  }
  closeColumnMenu()
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  document.addEventListener('click', closeColumnMenu)
  document.addEventListener('scroll', closeColumnMenu, true)
})

onUnmounted(() => {
  document.removeEventListener('click', closeColumnMenu)
  document.removeEventListener('scroll', closeColumnMenu, true)
})

watch(
  () => props.column.id,
  () => {
    closeColumnMenu()
    cancelEditColumnName()
  }
)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.column {
  background: $color-dark;
  border: 1px solid $text-dark;
  border-radius: 12px;
  min-width: 320px;
  max-width: 320px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  transition: all 0.2s ease;
  
  &.drag-over {
    background: #1e293b;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.2);
  }
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: $background-gray;
  border-bottom: 1px solid #374151;
  border-radius: 12px 12px 0 0;
}

.column-title-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.column-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: $text-light;
}

.column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 10px;
  background: #374151;
  color: #9ca3af;
  font-size: 12px;
  border-radius: 12px;
  font-weight: 500;
}

.column-actions {
  display: flex;
  gap: 4px;
}

.column-add-btn-header {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: rgba($blue, 0.15);
  border: 1px solid rgba($blue, 0.3);
  color: $blue;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  
  &:hover {
    background: rgba($blue, 0.25);
    transform: scale(1.05);
  }
  
  &.active {
    background: rgba($red, 0.2);
    border-color: rgba($red, 0.4);
    color: $red;
    
    &:hover {
      background: rgba($red, 0.3);
    }
  }
}

.column-menu-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: $text-light;
  }
}

.btn-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.icon-rotate {
    transform: rotate(90deg);
  }
}

// ============================================
// МЕНЮ КОЛОНКИ (TELEPORT)
// ============================================
.column-menu-dropdown {
  position: fixed;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  padding: 6px;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: $text-light;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  &.danger {
    color: $red;
    
    &:hover {
      background: rgba($red, 0.15);
    }
  }
}

// ============================================
// РЕДАКТИРОВАНИЕ НАЗВАНИЯ КОЛОНКИ
// ============================================
.column-name-edit {
  padding: 12px 16px;
  background: rgba($blue, 0.05);
  border-bottom: 1px solid #374151;
  animation: slideDown 0.2s ease;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: $text-light;
  font-size: 14px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 2px rgba($blue, 0.15);
  }
  
  &::placeholder {
    color: #6b7280;
  }
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #374151;
}

// ============================================
// ФОРМА СОЗДАНИЯ ЗАДАЧИ
// ============================================
.column-create-form {
  padding: 12px 16px;
  background: rgba($blue, 0.05);
  border-bottom: 1px solid #374151;
  animation: slideDown 0.2s ease;
}

.form-group {
  margin-bottom: 10px;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-control-select {
  flex: 1;
  padding: 8px 10px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: $text-light;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $blue;
  }
  
  option {
    background: #1f2937;
    color: $text-light;
  }
}

.form-control-date {
  flex: 1;
  padding: 8px 10px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: $text-light;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease;
  min-width: 130px;
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 2px rgba($blue, 0.15);
  }
  
  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
}

// ============================================
// КНОПКИ
// ============================================
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
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
  padding: 6px 8px;
  width: 32px;
  height: 32px;
}

.btn-primary {
  background: $blue;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: $green;
  }
}

.btn-secondary {
  background: #4b5563;
  color: $text-light;
  
  &:hover:not(:disabled) {
    background: #374151;
  }
}

// ============================================
// ТЕЛО КОЛОНКИ
// ============================================
.column-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  min-height: 200px;
}

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #6b7280;
  
  .icon {
    color: #4b5563;
    margin-bottom: 16px;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

.column-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-wrapper {
  position: relative;
  transition:
    transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
  will-change: transform;
  
  &.drop-indicator::before {
    content: '';
    position: absolute;
    left: -8px;
    right: -8px;
    top: -6px;
    height: 4px;
    background: linear-gradient(90deg, transparent, $blue, transparent);
    border-radius: 2px;
    animation: pulse 1.5s infinite;
    z-index: 10;
  }
  
  &.drop-indicator::after {
    content: '▼';
    position: absolute;
    left: 50%;
    top: -16px;
    transform: translateX(-50%);
    color: $blue;
    font-size: 16px;
    animation: bounce 0.5s infinite alternate;
    z-index: 10;
  }
}

.drop-indicator-end {
  height: 4px;
  background: linear-gradient(90deg, transparent, $blue, transparent);
  border-radius: 2px;
  margin: 6px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes bounce {
  from { transform: translateX(-50%) translateY(0); }
  to { transform: translateX(-50%) translateY(-4px); }
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

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: all 0.2s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ============================================
// АДАПТИВНОСТЬ
// ============================================
@media (max-width: 768px) {
  .column {
    min-width: 280px;
    max-width: 280px;
  }
  
  .form-row {
    flex-wrap: wrap;
  }
  
  .form-control-select,
  .form-control-date {
    flex: 1 1 45%;
  }
}

span {
  color: unset;
}
</style>