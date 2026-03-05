<!-- app/components/pages/cabinet/Boards/Kanban/index.vue -->
<template>
<div class="kanban-board">
  <!-- Шапка через отдельный компонент -->
  <Header 
    :board="selectedBoard || {}" 
    :folder="activeFolder" 
    @back="$emit('back')" 
    @create-task="showCreateTaskModal = true" 
  />
  
  <div class="kanban-content">
    <!-- Загрузка -->
    <div v-if="loading" class="kanban-loading">
      <div class="spinner"></div>
      <p>Загрузка задач...</p>
    </div>
    
    <!-- Ошибка -->
    <div v-else-if="error" class="kanban-error">
      <Icon name="mdi:alert-circle" size="48" />
      <p>{{ error }}</p>
      <button class="btn btn-secondary" @click="fetchTasks">
        Повторить
      </button>
    </div>
    
    <!-- Канбан-доска -->
    <div 
      v-else 
      ref="kanbanColumnsRef" 
      class="kanban-columns" 
      :class="{ 'dragging': isBoardDragging }"
      @mousedown="handleBoardMouseDown" 
      @mousemove="handleBoardMouseMove" 
      @mouseup="handleBoardMouseUp"
      @mouseleave="handleBoardMouseLeave"
    >
      <Column 
        v-for="status in columnStatuses" 
        :key="status.value" 
        :title="status.label" 
        :status="status.value"
        :tasks="getTasksByStatus(status.value)" 
        :board-id="selectedBoard?.id || 0" 
        @task-created="fetchTasks" 
      />
    </div>
  </div>
  
  <!-- Модалка создания задачи -->
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="showCreateTaskModal" class="modal-overlay" @click="closeCreateTaskModal">
        <div class="modal" @click.stop>
          <div class="modal-header">
            <h2>Создать задачу</h2>
            <button class="modal-close" @click="closeCreateTaskModal" aria-label="Закрыть">
              <Icon name="mdi:close" size="24" />
            </button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleCreateTask" class="create-task-form">
              <div class="form-group">
                <label for="task-title">Название задачи *</label>
                <input 
                  id="task-title" 
                  v-model="newTask.title" 
                  type="text" 
                  class="form-control"
                  placeholder="Введите название задачи" 
                  required 
                  autofocus 
                />
              </div>
              <div class="form-group">
                <label for="task-description">Описание</label>
                <textarea 
                  id="task-description" 
                  v-model="newTask.description" 
                  class="form-control"
                  placeholder="Описание задачи (необязательно)" 
                  rows="3"
                ></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="task-status">Статус</label>
                  <select id="task-status" v-model="newTask.status" class="form-control">
                    <option v-for="status in columnStatuses" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="task-priority">Приоритет</label>
                  <select id="task-priority" v-model="newTask.priority" class="form-control">
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="task-due-date">Срок выполнения</label>
                <input id="task-due-date" v-model="newTask.dueDate" type="date" class="form-control" />
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" @click="closeCreateTaskModal">
                  Отмена
                </button>
                <button type="submit" class="btn btn-primary" :disabled="creatingTask">
                  <span v-if="creatingTask">
                    <Icon name="mdi:loading" class="btn-icon spin" />
                    Создание...
                  </span>
                  <span v-else>Создать задачу</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
  
  <!-- Модалка деталей задачи -->
  <TaskDetails 
    v-if="taskModalStore.isOpen && taskModalStore.taskData"
    :task="taskModalStore.taskData"
    @close="taskModalStore.close"
    @task-updated="handleTaskUpdated" 
    @task-deleted="handleTaskDeleted" 
  />
</div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTasksStore } from 'stores/boards/tasks'
import { useTaskModalStore } from 'stores/boards/taskModal'
import { useBoardFoldersStore } from 'stores/boards/folders'
import { useBoardsStore } from 'stores/boards'
import Column from './Column/index.vue'
import TaskDetails from './TaskDetails/index.vue'
import Header from './Header/index.vue'
import type { Board, BoardFolder, Task } from '~/types/boards'
import { socketService } from 'services/socket.service'

// ============================================
// PROPS & EMITS
// ============================================
const emit = defineEmits<{
  back: []
}>()

// ============================================
// STORES
// ============================================
const tasksStore = useTasksStore()
const taskModalStore = useTaskModalStore()
const foldersStore = useBoardFoldersStore()
const boardsStore = useBoardsStore()

// ============================================
// STATE
// ============================================
const loading = computed(() => tasksStore.loading)
const error = computed(() => tasksStore.error)
const tasksByStatus = computed(() => tasksStore.tasksByStatus)
const showCreateTaskModal = ref(false)
const creatingTask = ref(false)
const newTask = ref({
  title: '',
  description: '',
  status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  dueDate: ''
})

// Board dragging state
const kanbanColumnsRef = ref<HTMLElement | null>(null)
const isBoardDragging = ref(false)
let dragStartX = 0
let dragStartScrollLeft = 0
let isDraggingBoard = false

// ============================================
// COMPUTED - Папка и доска
// ============================================
const activeFolder = computed(() => foldersStore.activeFolder)
const selectedBoard = computed(() => boardsStore.selectedBoard)

// ============================================
// Column statuses
// ============================================
const columnStatuses = [
  { value: 'todo', label: 'В ожидании' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review', label: 'На проверке' },
  { value: 'done', label: 'Завершено' },
  { value: 'blocked', label: 'Заблокировано' },
  { value: 'cancelled', label: 'Отменено' }
]

// ============================================
// METHODS
// ============================================
const fetchTasks = async () => {
  if (!selectedBoard.value?.id) return
  
  try {
    await tasksStore.fetchTasks(selectedBoard.value.id)
  } catch (err) {
    console.error('❌ Ошибка загрузки задач:', err)
  }
}

const getTasksByStatus = (status: string): Task[] => {
  const tasks = tasksByStatus.value[status as keyof typeof tasksByStatus.value]
  // ✅ Проверяем что это массив, а не число
  return Array.isArray(tasks) ? tasks : []
}

const handleCreateTask = async () => {
  if (!selectedBoard.value?.id) return
  
  creatingTask.value = true
  try {
    await tasksStore.createTask(selectedBoard.value.id, {
      title: newTask.value.title,
      description: newTask.value.description,
      status: newTask.value.status,
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate || null
    })
    closeCreateTaskModal()
  } catch (err) {
    console.error('Failed to create task:', err)
  } finally {
    creatingTask.value = false
  }
}

const closeCreateTaskModal = () => {
  showCreateTaskModal.value = false
  newTask.value = {
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    dueDate: ''
  }
}

const handleTaskUpdated = () => {
  if (taskModalStore.isOpen && taskModalStore.taskId) {
    const updatedTask = tasksStore.tasks.find(t => t.id === taskModalStore.taskId)
    if (updatedTask) {
      taskModalStore.setTaskData(updatedTask)
    }
  }
}

const handleTaskDeleted = () => {
  taskModalStore.close()
}

// ============================================
// ГОРИЗОНТАЛЬНОЕ ПЕРЕТАСКИВАНИЕ ДОСКИ
// ============================================
const handleBoardMouseDown = (e: MouseEvent) => {
  // Проверяем, что клик не по интерактивным элементам
  const target = e.target as HTMLElement
  
  // Игнорируем если клик по карточке задачи, кнопкам, инпутам и т.д.
  if (
    target.closest('.task-card') ||
    target.closest('.btn') ||
    target.closest('input') ||
    target.closest('textarea') ||
    target.closest('select') ||
    target.closest('.task-card-header') ||
    target.closest('.column-header') ||
    target.closest('.column-footer') ||
    target.tagName === 'BUTTON' ||
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT'
  ) {
    return
  }
  
  // Начинаем перетаскивание доски
  isDraggingBoard = true
  isBoardDragging.value = true
  dragStartX = e.clientX
  dragStartScrollLeft = kanbanColumnsRef.value?.scrollLeft || 0
  
  // Блокируем выделение текста
  if (kanbanColumnsRef.value) {
    kanbanColumnsRef.value.style.userSelect = 'none'
    kanbanColumnsRef.value.style.cursor = 'grabbing'
  }
  
  // Предотвращаем стандартное поведение (выделение)
  e.preventDefault()
}

const handleBoardMouseMove = (e: MouseEvent) => {
  if (!isDraggingBoard || !kanbanColumnsRef.value) return
  
  // Вычисляем смещение и прокручиваем
  const deltaX = e.clientX - dragStartX
  kanbanColumnsRef.value.scrollLeft = dragStartScrollLeft - deltaX * 1.5 // Коэффициент чувствительности
}

const handleBoardMouseUp = () => {
  if (!isDraggingBoard) return
  
  isDraggingBoard = false
  isBoardDragging.value = false
  
  // Восстанавливаем стандартные стили
  if (kanbanColumnsRef.value) {
    kanbanColumnsRef.value.style.userSelect = 'auto'
    kanbanColumnsRef.value.style.cursor = 'unset'
  }
}

const handleBoardMouseLeave = () => {
  // Сбрасываем состояние при выходе мыши за пределы окна
  if (isDraggingBoard && kanbanColumnsRef.value) {
    isDraggingBoard = false
    isBoardDragging.value = false
    kanbanColumnsRef.value.style.userSelect = 'unset'
    kanbanColumnsRef.value.style.cursor = 'grab'
  }
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(async () => {
  // ✅ 1. Сначала гарантируем инициализацию сокета
  if (process.client) {
    socketService.init()
    // Ждём подключения (макс. 2 сек)
    let attempts = 0
    while (!socketService.getConnected() && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
  }
  
  // ✅ 2. Затем загружаем задачи
  if (selectedBoard.value?.id) {
    await fetchTasks()
    // ✅ 3. Подписываемся на доску ПОСЛЕ подключения сокета
    if (socketService.getConnected()) {
      socketService.subscribeToBoard(selectedBoard.value.id)
    } else {
      console.warn('[Kanban] ⚠️ Socket not connected, cannot subscribe to board')
    }
  }
  
  // Глобальные обработчики для drag доски
  window.addEventListener('mouseup', handleBoardMouseUp)
  window.addEventListener('mouseleave', handleBoardMouseLeave)
})

onUnmounted(() => {
  tasksStore.clearState()
    if (selectedBoard.value?.id) {
    socketService.unsubscribeFromBoard(selectedBoard.value.id)
  }
  // Удаляем глобальные обработчики
  window.removeEventListener('mouseup', handleBoardMouseUp)
  window.removeEventListener('mouseleave', handleBoardMouseLeave)
})

// Следим за изменением выбранной доски
watch(
  () => selectedBoard.value?.id,
  (newBoardId, oldBoardId) => {
    if (newBoardId && newBoardId !== oldBoardId) {
      fetchTasks()
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.kanban-board {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.kanban-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.kanban-loading,
.kanban-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: $text-light;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #3a3a3a;
  border-top-color: $blue;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.kanban-error {
  p {
    margin: 15px 0;
    font-size: 16px;
  }
}

.kanban-columns {
  display: flex;
  gap: 10px;
  padding: 10px;
  overflow-x: auto;
  height: 100%;
  // cursor: grab;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #374151 #1f2937;
  
  // Стили для WebKit (Chrome, Safari)
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #1f2937;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #374151;
    border-radius: 4px;
    
    &:hover {
      background: #4b5563;
    }
  }
  
  // Состояние перетаскивания
  &.dragging {
    // cursor: grabbing;
    user-select: none;
    scroll-behavior: auto; // Отключаем плавную прокрутку во время перетаскивания
    
    // Визуальная подсказка
    &::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      // background: rgba(0, 0, 0, 0.3);
      z-index: 100;
      pointer-events: none;
      cursor: grabbing;
    }
  }
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: #111827;
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #374151;
  
  h2 {
    margin: 0;
    font-size: 20px;
    color: $text-light;
  }
  
  .modal-close {
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    
    &:hover {
      color: $text-light;
      background: #374151;
    }
  }
}

.modal-body {
  padding: 24px;
}

.create-task-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    color: $text-light;
    font-size: 14px;
    font-weight: 500;
  }
}

.form-control {
  width: 100%;
  padding: 12px 16px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  color: $text-light;
  font-size: 14px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.1);
  }
  
  &::placeholder {
    color: #6b7280;
  }
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #374151;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
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
    background: $red;
    transform: translateY(-1px);
  }
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

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .kanban-columns {
    flex-direction: column;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>