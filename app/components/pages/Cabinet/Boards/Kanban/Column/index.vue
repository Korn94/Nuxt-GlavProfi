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
        <h2 class="column-title">{{ title }}</h2>
        <span class="column-count">{{ tasks.length }}</span>
      </div>
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
    </div>

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
        <!-- ✅ КЛЮЧЕВОЕ: :key только по task.id, без order -->
        <div
          v-for="task in sortedTasks"
          :key="task.id"
          class="task-wrapper"
          :class="{ 'drop-indicator': dropIndex === getTaskIndex(task) }"
        >
          <TaskCard
            :task="task"
            :board-id="boardId"
            @move-task="handleMoveTask"
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
import { ref, computed, shallowRef, watch } from 'vue'
import { useTasks } from '~/composables/boards/useTasks'
import { useTasksStore } from 'stores/boards/tasks'
import { socketService } from 'services/socket.service'
import TaskCard from '../TaskCard.vue'
import type { Task } from '~/types/boards'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  boardId: number
  title: string
  tasks: Task[]
  status: string
}>()

const emit = defineEmits<{
  taskCreated: []
}>()

// ============================================
// STORES & COMPOSABLES
// ============================================
const { createTask, updateTask, updateTasksOrder } = useTasks()
const tasksStore = useTasksStore()

// ============================================
// STATE — Оптимизация через shallowRef
// ============================================
const showCreateForm = ref(false)
const creatingTask = ref(false)
const isDraggingOver = ref(false)
const dropIndex = ref<number | null>(null)

// ✅ shallowRef для предотвращения глубокой реактивности
const tasksRef = shallowRef<Task[]>([...props.tasks])

// ✅ Обновляем shallowRef только если изменились ID или order
watch(() => props.tasks, (newTasks) => {
  const oldIds = tasksRef.value.map(t => `${t.id}-${t.order}`)
  const newIds = newTasks.map(t => `${t.id}-${t.order}`)
  
  // Обновляем только если действительно изменилось
  if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
    tasksRef.value = [...newTasks]
  }
}, { deep: false })

const newTask = ref({
  title: '',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  dueDate: ''
})

// ============================================
// COMPUTED
// ============================================
const canSubmit = computed(() => newTask.value.title.trim().length > 0)

// ✅ sortedTasks возвращает отсортированный массив, но не создаёт новые объекты
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
// METHODS - ФОРМА
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
    await createTask(props.boardId, {
      title: newTask.value.title.trim(),
      description: '',
      status: props.status as any,
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate || null
    })
    closeCreateForm()
    emit('taskCreated')
  } catch (err) {
    console.error('[Column] ❌ Failed to create task:', err)
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

const handleMoveTask = async (taskId: number, newStatus: string) => {
  try {
    await updateTask(taskId, { status: newStatus as any })
  } catch (error) {
    console.error('[Column] ❌ Failed to move task:', error)
  }
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
// DRAG & DROP - Обработка drop (ГЛАВНОЕ ИСПРАВЛЕНИЕ)
// ============================================
const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDraggingOver.value = false
  
  try {
    // ✅ 1. Безопасное получение данных
    const data = event.dataTransfer?.getData('application/json')
    if (!data) {
      console.warn('[Column] No drag data found')
      return
    }
    
    // ✅ 2. Парсинг с типизацией
    const dragData = JSON.parse(data) as { 
      type: string
      taskId: number
      status: string
    }
    
    // ✅ 3. Валидация обязательных полей
    if (dragData.type !== 'task' || !dragData.taskId || !dragData.status) {
      console.warn('[Column] Invalid drag data:', dragData)
      return
    }
    
    // ✅ Теперь TS «видит», что поля существуют
    const taskId = dragData.taskId
    const fromStatus = dragData.status
    const toStatus = props.status
    
    // ✅ СЛУЧАЙ 1: Перемещение между колонками (изменение статуса)
    if (fromStatus !== toStatus) {
      // 1️⃣ Оптимистичное обновление UI (мгновенно, без мигания)
      await tasksStore.updateTaskOptimistic(taskId, { status: toStatus as any })
      
      // 2️⃣ Прямой API-запрос БЕЗ участия store (не триггерит loading!)
      await $fetch(`/api/boards/tasks/${taskId}`, {
        method: 'PUT',
        body: { status: toStatus }
      })
      
      // 3️⃣ Socket broadcast для других клиентов
      await socketService.emit('board:task:updated', {
        boardId: props.boardId,
        taskId,
        task: { id: taskId, status: toStatus }
      })
      
    // ✅ СЛУЧАЙ 2: Перемещение внутри одной колонки (изменение order)
    } else if (dropIndex.value !== null) {
      const currentOrder = props.tasks.findIndex(t => t.id === taskId)
      const newOrder = dropIndex.value
      
      if (currentOrder !== -1 && currentOrder !== newOrder) {
        // 1️⃣ Копируем и пересчитываем порядок
        const columnTasks = [...props.tasks]
        const [movedTask] = columnTasks.splice(currentOrder, 1)
        if (!movedTask) return
        columnTasks.splice(newOrder, 0, movedTask)
        
        const updates = columnTasks.map((task, index) => ({
          id: task.id,
          order: index
        }))
        
        // 2️⃣ Оптимистичное обновление в store (in-place, без замены массива)
        updates.forEach(({ id, order }) => {
          const task = tasksStore.tasks.find(t => t.id === id)
          if (task) task.order = order
        })
        
        // 3️⃣ Прямой API-запрос БЕЗ loading
        await $fetch(`/api/boards/${props.boardId}/tasks/order`, {
          method: 'PUT',
          body: { updates }
        })
        
        // 4️⃣ Socket broadcast для синхронизации
        await socketService.emit('board:tasks:reorder', {
          boardId: props.boardId,
          status: props.status,
          tasks: updates
        })
      }
    }
  } catch (error) {
    console.error('Failed to drop task:', error)
    // ✅ Fallback: перезагружаем задачи ТОЛЬКО при ошибке
    await tasksStore.fetchTasks(props.boardId)
  } finally {
    dropIndex.value = null
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.column {
  background: $color-dark;
  border: 1px solid $text-dark;
  border-radius: 12px;
  min-width: 320px;
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

.btn-icon {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.icon-rotate {
    transform: rotate(90deg);
  }
}

.column-create-form {
  padding: 12px 16px;
  background: rgba($blue, 0.05);
  border-bottom: 1px solid #374151;
  animation: slideDown 0.2s ease;
}

.form-group {
  margin-bottom: 10px;
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
  
  &::-webkit-datetime-edit {
    color: $text-light;
  }
  
  &::-webkit-datetime-edit-fields-wrapper {
    padding: 0;
  }
}

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

@media (max-width: 768px) {
  .column {
    min-width: 280px;
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