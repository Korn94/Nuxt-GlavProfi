<!-- app/components/pages/cabinet/Boards/ui/BoardColumn.vue -->
<template>
  <div 
    class="board-column" 
    :class="{ 'drag-over': isDraggingOver }"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="board-column-header">
      <h2 class="board-column-title">
        {{ title }}
        <span class="board-column-count">{{ tasks.length }}</span>
      </h2>
      <button class="btn btn-sm btn-primary" @click="showCreateTask = true">
        +
      </button>
    </div>

    <div class="board-column-body">
      <div v-if="tasks.length === 0" class="board-column-empty">
        <p>Нет задач</p>
      </div>

      <div v-else class="board-column-tasks">
        <div 
          v-for="(task, index) in sortedTasks" 
          :key="task.id"
          class="board-column-task-wrapper"
          :class="{ 'drop-indicator': dropIndex === index }"
        >
          <BoardTaskCard
            :task="task"
            :board-id="boardId"
            @move-task="handleMoveTask"
          />
        </div>
        
        <!-- Индикатор вставки в конец -->
        <div 
          v-if="dropIndex === sortedTasks.length" 
          class="drop-indicator drop-indicator-end"
        ></div>
      </div>
    </div>

    <div class="board-column-footer">
      <button class="board-column-add-task" @click="showCreateTask = true">
        <span>+</span> Добавить задачу
      </button>
    </div>

    <!-- Модалка создания задачи -->
    <div v-if="showCreateTask" class="modal-overlay" @click="showCreateTask = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h2>Создать задачу в "{{ title }}"</h2>
          <button class="modal-close" @click="showCreateTask = false">×</button>
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
              <button type="button" class="btn btn-secondary" @click="showCreateTask = false">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTasks } from '~/composables/boards/useTasks'
import { useTasksStore } from '~~/stores/boards/tasks'
import BoardTaskCard from './BoardTaskCard.vue'
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
const { createTask, updateTask } = useTasks()
const tasksStore = useTasksStore()

// ============================================
// STATE
// ============================================
const showCreateTask = ref(false)
const creatingTask = ref(false)
const isDraggingOver = ref(false)
const dropIndex = ref<number | null>(null)

const newTask = ref({
  title: '',
  description: '',
  priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  dueDate: ''
})

// ============================================
// DRAG & DROP - DROP ZONE
// ============================================
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  
  // Определяем позицию вставки
  const target = event.target as HTMLElement
  const taskElements = Array.from(target.closest('.board-column')?.querySelectorAll('.board-column-task-wrapper') || [])
  
  if (taskElements.length > 0) {
    // Находим ближайший элемент
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
  
  // ✅ ИСПРАВЛЕНО: Проверяем, что это действительно элемент
  const currentTarget = event.currentTarget as HTMLElement | null
  if (!relatedTarget || !currentTarget || !currentTarget.contains(relatedTarget)) {
    isDraggingOver.value = false
    dropIndex.value = null
  }
}

const handleDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDraggingOver.value = false
  
  try {
    const data = event.dataTransfer!.getData('application/json')
    const dragData = JSON.parse(data)
    
    if (dragData.type === 'task') {
      // ✅ ЕСЛИ СТАТУС ИЗМЕНИЛСЯ - ОБНОВЛЯЕМ ОПТИМИСТИЧНО
      if (dragData.status !== props.status) {
        await tasksStore.updateTaskOptimistic(dragData.taskId, { 
          status: props.status as any 
        })
      }
      // ✅ ЕСЛИ ПОРЯДОК ИЗМЕНИЛСЯ - ОБНОВЛЯЕМ ВСЕ ЗАДАЧИ ПАКЕТНО
      else if (dropIndex.value !== null) {
        const currentOrder = props.tasks.findIndex(t => t.id === dragData.taskId)
        const newOrder = dropIndex.value
        
        if (currentOrder !== -1 && currentOrder !== newOrder) {
          const updatedTasks = [...props.tasks]
          const movedTask = updatedTasks.splice(currentOrder, 1)[0]
          updatedTasks.splice(newOrder, 0, movedTask)
          
          // ✅ ОДИН ЗАПРОС ДЛЯ ВСЕЙ КОЛОНКИ
          await tasksStore.updateTasksOrderOptimistic(props.boardId, updatedTasks)
        }
      }
      
      // ❌ НЕ ВЫЗЫВАЕМ fetchBoardTasks - РЕАКТИВНОСТЬ САМА ОБНОВИТ ИНТЕРФЕЙС!
    }
  } catch (error) {
    console.error('Failed to drop task:', error)
    // ❌ НЕ ПЕРЕЗАГРУЖАЕМ - ОТКАТ УЖЕ СДЕЛАН В СТОРЕ
  } finally {
    dropIndex.value = null
  }
}

// ============================================
// COMPUTED
// ============================================
const sortedTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    // Сначала по приоритету
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    
    const aPriority = a.priority || 'low'
    const bPriority = b.priority || 'low'
    const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority]
    
    if (priorityDiff !== 0) return priorityDiff
    
    // Затем по порядку
    const aOrder = a.order ?? 0
    const bOrder = b.order ?? 0
    return aOrder - bOrder
  })
})

// ============================================
// METHODS
// ============================================
const handleCreateTask = async () => {
  creatingTask.value = true
  try {
    await createTask(props.boardId, {
      title: newTask.value.title,
      description: newTask.value.description,
      status: props.status as any,
      priority: newTask.value.priority,
      dueDate: newTask.value.dueDate || null
    })
    
    showCreateTask.value = false
    newTask.value = {
      title: '',
      description: '',
      priority: 'medium',
      dueDate: ''
    }
    
    emit('taskCreated')
  } catch (err) {
    console.error('Failed to create task:', err)
  } finally {
    creatingTask.value = false
  }
}

const handleMoveTask = async (taskId: number, newStatus: string) => {
  try {
    await updateTask(taskId, { status: newStatus as any })
    // emit('taskUpdated')
  } catch (error) {
    console.error('Failed to move task:', error)
  }
}
</script>

<style scoped lang="scss">
.board-column {
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 8px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
  transition: all 0.2s ease;
  
  &.drag-over {
    background: #1e293b;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
  }
}

.board-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #111827;
  border-bottom: 1px solid #374151;
  border-radius: 8px 8px 0 0;
}

.board-column-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.board-column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background: #374151;
  color: #9ca3af;
  font-size: 12px;
  border-radius: 12px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 14px;
}

.board-column-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.board-column-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.board-column-empty p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.board-column-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.board-column-task-wrapper {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.drop-indicator::before {
    content: '';
    position: absolute;
    left: -8px;
    right: -8px;
    top: -6px;
    height: 4px;
    background: linear-gradient(90deg, transparent, #3b82f6, transparent);
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
    color: #3b82f6;
    font-size: 16px;
    animation: bounce 0.5s infinite alternate;
    z-index: 10;
  }
}

.drop-indicator-end {
  height: 4px;
  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  border-radius: 2px;
  margin: 6px 0;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

@keyframes bounce {
  from {
    transform: translateX(-50%) translateY(0);
  }
  to {
    transform: translateX(-50%) translateY(-4px);
  }
}

.board-column-footer {
  padding: 12px 16px;
  border-top: 1px solid #374151;
}

.board-column-add-task {
  width: 100%;
  padding: 10px 16px;
  background: transparent;
  border: 1px dashed #334155;
  border-radius: 6px;
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #1e293b;
    border-color: #3b82f6;
    color: #3b82f6;
  }
  
  span {
    font-size: 20px;
    line-height: 1;
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