<!-- app/components/pages/cabinet/Boards/Kanban/index.vue -->
<template>
  <div class="kanban-board">
    <!-- Шапка через отдельный компонент -->
    <Header :board="selectedBoard || {}" :folder="activeFolder" @back="$emit('back')"
      @create-task="showCreateTaskModal = true" />

    <div class="kanban-content">
      <!-- Загрузка -->
      <div v-if="loading" class="kanban-loading">
        <div class="spinner"></div>
        <p>Загрузка доски...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="kanban-error">
        <Icon name="mdi:alert-circle" size="48" />
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="fetchData">
          Повторить
        </button>
      </div>

      <!-- ✅ КАСТОМНЫЕ КОЛОНКИ -->
      <div v-else ref="kanbanColumnsRef" class="kanban-columns" :class="{ 'dragging': isBoardDragging }"
        @mousedown="handleBoardMouseDown" @mousemove="handleBoardMouseMove" @mouseup="handleBoardMouseUp"
        @mouseleave="handleBoardMouseLeave">
        <!-- ✅ КОЛОНКИ ИЗ БД -->
        <Column v-for="(column, index) in sortedColumns" :key="column.id" :column="column"
          :tasks="getTasksByColumnId(column.id, index === 0)" :board-id="selectedBoard?.id || 0"
          @task-created="fetchData" @column-updated="fetchData" />

        <!-- ✅ PLACEHOLDER ДЛЯ ДОБАВЛЕНИЯ КОЛОНКИ -->
        <AddColumnPlaceholder :board-id="selectedBoard?.id || 0" :is-first-column="columns.length === 0"
          @column-created="onColumnCreated" />
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
                  <input id="task-title" v-model="newTask.title" type="text" class="form-control"
                    placeholder="Введите название задачи" required autofocus />
                </div>

                <div class="form-group">
                  <label for="task-description">Описание</label>
                  <textarea id="task-description" v-model="newTask.description" class="form-control"
                    placeholder="Описание задачи (необязательно)" rows="3"></textarea>
                </div>

                <!-- ✅ ВЫБОР КОЛОНКИ ВМЕСТО СТАТУСА -->
                <div class="form-group" v-if="columns.length > 0">
                  <label for="task-column">Колонка</label>
                  <select id="task-column" v-model="newTask.columnId" class="form-control">
                    <option v-for="column in sortedColumns" :key="column.id" :value="column.id">
                      {{ column.name }}
                    </option>
                  </select>
                </div>

                <div class="form-row">
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
    <TaskDetails v-if="taskModalStore.isOpen && taskModalStore.taskData" :task="taskModalStore.taskData"
      @close="taskModalStore.close" @task-updated="handleTaskUpdated" @task-deleted="handleTaskDeleted" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTasksStore } from 'stores/boards/tasks'
import { useTaskModalStore } from 'stores/boards/taskModal'
import { useBoardFoldersStore } from 'stores/boards/folders'
import { useBoardsStore } from 'stores/boards'
import { useColumns } from '~/composables/boards/useColumns'
import Column from './Column/index.vue'
import TaskDetails from './TaskDetails/index.vue'
import Header from './Header/index.vue'
import AddColumnPlaceholder from './Column/AddColumnPlaceholder.vue'
import type { Board, BoardFolder, Task, BoardColumn } from '~/types/boards'
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
// COMPOSABLES
// ============================================
const {
  columns,
  loading: columnsLoading,
  error: columnsError,
  fetchColumns,
  createColumn,
  subscribeToBoard,
  unsubscribeFromBoard,
  updateColumnsOrder
} = useColumns()

// ============================================
// STATE
// ============================================
const loading = ref(false)
const error = ref<string | null>(null)
const showCreateTaskModal = ref(false)
const creatingTask = ref(false)
const newTask = ref({
  title: '',
  description: '',
  columnId: 0, // ✅ Вместо status используем columnId
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
// COMPUTED - Сортировка колонок
// ============================================
const sortedColumns = computed(() => {
  // ✅ ПРОВЕРКА: массив может быть пустым
  const cols = columns.value || []
  return [...cols].sort((a: BoardColumn, b: BoardColumn) => a.order - b.order)
})

// ============================================
// COMPUTED - Объединённый loading и error
// ============================================
const combinedLoading = computed(() => {
  return loading.value ||
    columnsLoading.value ||
    tasksStore.loading
})

const combinedError = computed(() => {
  return error.value ||
    columnsError.value ||
    tasksStore.error
})

const unassignedTasks = computed(() => {
  return (tasksStore.tasks || []).filter(
    (task: Task) => task.columnId === null || task.columnId === undefined
  )
})

// ============================================
// METHODS - Получение задач по колонке
// ============================================
const getTasksByColumnId = computed(() => {
  return (columnId: number, isFirst = false): Task[] => {
    const tasks = tasksStore.tasks || []
    return tasks
      .filter((task: Task) => {
        if (isFirst) {
          // Первая колонка получает и задачи без колонки
          return task.columnId === columnId || task.columnId == null
        }
        return task.columnId === columnId
      })
      .sort((a: Task, b: Task) => (a.order ?? 0) - (b.order ?? 0))
  }
})

// ============================================
// METHODS - Загрузка данных
// ============================================
const fetchData = async () => {
  const boardId = selectedBoard.value?.id
  if (!boardId) return

  try {
    loading.value = true
    error.value = null

    // ✅ 1. Загружаем колонки
    await fetchColumns(boardId)

    // ✅ 2. Загружаем задачи
    await tasksStore.fetchTasks(boardId)

    console.log('[Kanban] ✅ Данные загружены:', {
      columns: columns.value.length,
      tasks: tasksStore.tasks.length
    })
  } catch (err: any) {
    console.error('[Kanban] ❌ Ошибка загрузки данных:', err)
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loading.value = false
  }
}

// ============================================
// METHODS - Создание задачи
// ============================================
const handleCreateTask = async () => {
  const boardId = selectedBoard.value?.id
  if (!boardId) return

  // ✅ Если нет колонок, создаём первую автоматически
  let targetColumnId = newTask.value.columnId
  if (!targetColumnId && columns.value.length === 0) {
    try {
      const newColumn = await createColumn(boardId, {
        name: 'По умолчанию',
        order: 0
      })
      targetColumnId = newColumn.id
    } catch (err: any) {
      console.error('[Kanban] ❌ Не удалось создать колонку:', err)
      return
    }
  }

  if (!targetColumnId) {
    console.error('[Kanban] ❌ Нет колонки для задачи')
    return
  }

  creatingTask.value = true

  try {
    await tasksStore.createTask(boardId, {
      title: newTask.value.title,
      description: newTask.value.description,
      columnId: targetColumnId, // ✅ Передаём columnId
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate || null
    })

    closeCreateTaskModal()
  } catch (err: any) {
    console.error('[Kanban] ❌ Ошибка создания задачи:', err)
    error.value = err.message || 'Ошибка создания задачи'
  } finally {
    creatingTask.value = false
  }
}

const closeCreateTaskModal = () => {
  showCreateTaskModal.value = false
  newTask.value = {
    title: '',
    description: '',
    columnId: columns.value[0]?.id || 0,
    priority: 'medium',
    dueDate: ''
  }
}

// ============================================
// METHODS - Обработчики событий
// ============================================
const handleTaskUpdated = () => {
  if (taskModalStore.isOpen && taskModalStore.taskId) {
    const updatedTask = tasksStore.tasks.find((t: Task) => t.id === taskModalStore.taskId)
    if (updatedTask) {
      taskModalStore.setTaskData(updatedTask)
    }
  }
}

const handleTaskDeleted = () => {
  taskModalStore.close()
}

const onColumnCreated = (columnId: number) => {
  console.log('[Kanban] ✅ Колонка создана:', columnId)
  // ✅ Устанавливаем новую колонку как выбранную для следующей задачи
  newTask.value.columnId = columnId
}

// ============================================
// ГОРИЗОНТАЛЬНОЕ ПЕРЕТАСКИВАНИЕ ДОСКИ
// ============================================
const handleBoardMouseDown = (e: MouseEvent) => {
  const target = e.target as HTMLElement

  // Игнорируем если клик по интерактивным элементам
  if (
    target.closest('.task-card') ||
    target.closest('.btn') ||
    target.closest('input') ||
    target.closest('textarea') ||
    target.closest('select') ||
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

  if (kanbanColumnsRef.value) {
    kanbanColumnsRef.value.style.userSelect = 'none'
    kanbanColumnsRef.value.style.cursor = 'grabbing'
  }

  e.preventDefault()
}

const handleBoardMouseMove = (e: MouseEvent) => {
  if (!isDraggingBoard || !kanbanColumnsRef.value) return

  const deltaX = e.clientX - dragStartX
  kanbanColumnsRef.value.scrollLeft = dragStartScrollLeft - deltaX * 1.5
}

const handleBoardMouseUp = () => {
  if (!isDraggingBoard) return

  isDraggingBoard = false
  isBoardDragging.value = false

  if (kanbanColumnsRef.value) {
    kanbanColumnsRef.value.style.userSelect = 'auto'
    kanbanColumnsRef.value.style.cursor = 'unset'
  }
}

const handleBoardMouseLeave = () => {
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
  // ✅ 1. Инициализация сокета
  if (process.client) {
    socketService.init()

    let attempts = 0
    while (!socketService.getConnected() && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
  }

  // Глобальные обработчики для drag доски
  window.addEventListener('mouseup', handleBoardMouseUp)
  window.addEventListener('mouseleave', handleBoardMouseLeave)
})

onUnmounted(() => {
  tasksStore.clearState()

  if (selectedBoard.value?.id) {
    unsubscribeFromBoard(selectedBoard.value.id)
    console.log('[Kanban] ✅ Отписка от доски:', selectedBoard.value.id)
  }

  window.removeEventListener('mouseup', handleBoardMouseUp)
  window.removeEventListener('mouseleave', handleBoardMouseLeave)
})

// Следим за изменением выбранной доски
watch(
  () => selectedBoard.value?.id,
  async (newBoardId, oldBoardId) => {
    if (newBoardId && newBoardId !== oldBoardId) {
      console.log('[Kanban] 🔄 Смена доски:', { from: oldBoardId, to: newBoardId })
      await fetchData()
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

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
    user-select: none;
    scroll-behavior: auto;

    &::after {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
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
  grid-template-columns: 1fr;
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