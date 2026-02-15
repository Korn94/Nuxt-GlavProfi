<!-- app/components/pages/cabinet/Boards/ui/BoardKanban.vue -->
<template>
  <div class="board-kanban">
    <div class="board-kanban-header">
      <button class="btn btn-secondary" @click="handleBack">
        ← Назад к списку досок
      </button>
      
      <h1 class="board-kanban-title">{{ board.name }}</h1>
      
      <div class="board-kanban-actions">
        <button class="btn btn-primary" @click="showCreateTaskModal = true">
          <span class="icon">+</span>
          Новая задача
        </button>
      </div>
    </div>

    <div class="board-kanban-content">
      <div v-if="loading" class="board-kanban-loading">
        <div class="spinner"></div>
        <p>Загрузка задач...</p>
      </div>

      <div v-else-if="error" class="board-kanban-error">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="fetchBoardTasks">
          Повторить
        </button>
      </div>

      <div v-else class="board-columns">
        <!-- Колонка "В ожидании" -->
        <BoardColumn
          title="В ожидании"
          :board-id="board.id"
          :tasks="getTasksByStatus('todo')"
          status="todo"
          @task-created="fetchBoardTasks"
        />

        <!-- Колонка "В работе" -->
        <BoardColumn
          title="В работе"
          :board-id="board.id"
          :tasks="getTasksByStatus('in_progress')"
          status="in_progress"
          @task-created="fetchBoardTasks"
        />

        <!-- Колонка "На проверке" -->
        <BoardColumn
          title="На проверке"
          :board-id="board.id"
          :tasks="getTasksByStatus('review')"
          status="review"
          @task-created="fetchBoardTasks"
        />

        <!-- Колонка "Завершено" -->
        <BoardColumn
          title="Завершено"
          :board-id="board.id"
          :tasks="getTasksByStatus('done')"
          status="done"
          @task-created="fetchBoardTasks"
        />

        <!-- Колонка "Заблокировано" -->
        <BoardColumn
          title="Заблокировано"
          :board-id="board.id"
          :tasks="getTasksByStatus('blocked')"
          status="blocked"
          @task-created="fetchBoardTasks"
        />

        <!-- Колонка "Отменено" -->
        <BoardColumn
          title="Отменено"
          :board-id="board.id"
          :tasks="getTasksByStatus('cancelled')"
          status="cancelled"
          @task-created="fetchBoardTasks"
        />
      </div>
    </div>

    <!-- Модалка создания задачи -->
    <div v-if="showCreateTaskModal" class="modal-overlay" @click="closeCreateTaskModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Создать задачу</h2>
          <button class="modal-close" @click="closeCreateTaskModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleCreateTask">
            <div class="form-group">
              <label for="task-title">Название задачи *</label>
              <input
                id="task-title"
                v-model="newTask.title"
                type="text"
                class="form-control"
                placeholder="Введите название задачи"
                required
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

            <div class="form-group">
              <label for="task-status">Статус</label>
              <select
                id="task-status"
                v-model="newTask.status"
                class="form-control"
              >
                <option value="todo">В ожидании</option>
                <option value="in_progress">В работе</option>
                <option value="review">На проверке</option>
                <option value="done">Завершено</option>
                <option value="blocked">Заблокировано</option>
                <option value="cancelled">Отменено</option>
              </select>
            </div>

            <div class="form-group">
              <label for="task-priority">Приоритет</label>
              <select
                id="task-priority"
                v-model="newTask.priority"
                class="form-control"
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
                <option value="urgent">Срочный</option>
              </select>
            </div>

            <div class="form-group">
              <label for="task-due-date">Срок выполнения</label>
              <input
                id="task-due-date"
                v-model="newTask.dueDate"
                type="date"
                class="form-control"
              />
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" @click="closeCreateTaskModal">
                Отмена
              </button>
              <button type="submit" class="btn btn-primary" :disabled="creatingTask">
                {{ creatingTask ? 'Создание...' : 'Создать' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <BoardTaskDetails
      v-if="taskModalStore.isOpen"
      :task="taskModalStore.taskData || {}"
      @close="taskModalStore.close"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { useTasksStore } from '../../../../../../stores/boards/tasks'
import { useTaskModalStore } from '../../../../../../stores/boards/taskModal'
import BoardColumn from './BoardColumn.vue'
import BoardTaskDetails from './BoardTaskDetails.vue'

const props = defineProps<{
  board: {
    id: number
    name: string
    description?: string | null
  }
}>()

const emit = defineEmits<{
  back: []
}>()

const tasksStore = useTasksStore()
const taskModalStore = useTaskModalStore()

const loading = computed(() => tasksStore.loading)
const error = computed(() => tasksStore.error)
const tasksByStatus = computed(() => tasksStore.tasksByStatus)

// State
const showCreateTaskModal = ref(false)
const creatingTask = ref(false)

const newTask = ref({
  title: '',
  description: '',
  status: 'todo' as 'todo' | 'in_progress' | 'review' | 'done' | 'blocked' | 'cancelled',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  dueDate: ''
})

// ============================================
// METHODS - без перезагрузки
// ============================================
const fetchBoardTasks = async () => {
  try {
    await tasksStore.fetchTasks(props.board.id)
  } catch (err) {
    console.error('❌ Ошибка загрузки задач:', err)
  }
}

const handleCreateTask = async () => {
  creatingTask.value = true
  try {
    const task = await tasksStore.createTask(props.board.id, {
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

const handleBack = () => {
  tasksStore.clearState()
  emit('back')
}

// Обработчики событий модалки - без перезагрузки
const handleTaskUpdated = () => {
  // ✅ Ничего не перезагружаем - реактивность через стор
  if (taskModalStore.isOpen && taskModalStore.taskId) {
    const updatedTask = tasksStore.tasks.find(t => t.id === taskModalStore.taskId)
    if (updatedTask) {
      taskModalStore.setTaskData(updatedTask)
    }
  }
}

const handleTaskDeleted = () => {
  // ✅ Ничего не перезагружаем - реактивность через стор
  taskModalStore.close()
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

const getTasksByStatus = (status: string) => {
  return tasksByStatus.value[status as keyof typeof tasksByStatus.value] || []
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  fetchBoardTasks()
})

onUnmounted(() => {
  tasksStore.clearState()
})

watch(() => props.board.id, (newBoardId) => {
  if (newBoardId) {
    fetchBoardTasks()
  }
})
</script>

<style scoped lang="scss">
.board-kanban {
  height: 100%;
}

.board-kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #111827;
  border-radius: 12px;
  border: 1px solid #374151;
}

.board-kanban-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.board-kanban-actions {
  display: flex;
  gap: 10px;
}

.board-kanban-content {
  height: calc(100vh - 250px);
  overflow-y: auto;
  padding: 10px;
}

.board-kanban-loading,
.board-kanban-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.board-kanban-error p {
  margin: 15px 0;
  color: #9ca3af;
  font-size: 16px;
}

.board-columns {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  min-height: 100%;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #3a3a3a;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Modal styles (повторяем из предыдущего компонента) */
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
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #374151;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: #fff;
}

.modal-close {
  background: none;
  border: none;
  font-size: 28px;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  
  &:hover {
    color: #fff;
  }
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #fff;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
}

.form-control::placeholder {
  color: #6b7280;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #374151;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
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
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: #4b5563;
  color: #fff;
  
  &:hover {
    background: #374151;
  }
}
</style>