<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sections/Subtasks.vue -->
<template>
  <div class="task-section subtasks-section">
    <!-- Заголовок секции -->
    <div class="section-header">
      <h3 class="section-title">
        <Icon name="mdi:checkbox-marked-circle-outline" size="20" />
        Подзадачи
        <span class="section-count">
          {{ completedCount }}/{{ totalCount }}
        </span>
      </h3>
      <button
        class="btn btn-sm btn-primary"
        @click="showAddForm = true"
        :disabled="addingSubtask"
      >
        <Icon name="mdi:plus" size="16" />
        Добавить
      </button>
    </div>

    <!-- Прогресс-бар (только первый уровень по требованиям) -->
    <div v-if="totalCount > 0" class="subtasks-progress">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progressPercent}%` }"
          :class="{ complete: progressPercent === 100 }"
        ></div>
      </div>
      <span class="progress-text">{{ progressPercent }}% завершено</span>
    </div>

    <!-- Форма добавления корневой подзадачи -->
    <Transition name="form-slide">
      <div v-if="showAddForm" class="subtask-add-form">
        <div class="form-group">
          <input
            ref="titleInputRef"
            v-model="newSubtask.title"
            type="text"
            class="form-control"
            placeholder="Название подзадачи..."
            @keyup.enter="addSubtask"
            @keyup.esc="cancelAdd"
            autofocus
          />
        </div>
        <div class="form-group">
          <textarea
            v-model="newSubtask.description"
            class="form-control"
            placeholder="Описание (необязательно)"
            rows="2"
          ></textarea>
        </div>
        <div class="form-actions">
          <button
            class="btn btn-secondary"
            @click="cancelAdd"
            :disabled="addingSubtask"
          >
            Отмена
          </button>
          <button
            class="btn btn-primary"
            @click="addSubtask"
            :disabled="addingSubtask || !canAdd"
          >
            <Icon v-if="addingSubtask" name="mdi:loading" size="16" class="spin" />
            <Icon v-else name="mdi:check" size="16" />
            {{ addingSubtask ? 'Добавление...' : 'Добавить' }}
          </button>
        </div>
      </div>
    </Transition>

    <!-- Список подзадач (дерево из flat-списка) -->
    <div v-if="subtaskTree && subtaskTree.length > 0" class="subtasks-list">
      <SubtaskItem
        v-for="subtask in subtaskTree"
        :key="`task-${taskId}-${subtask.id}`"
        :subtask="subtask"
        :task-id="taskId"
        :depth="subtask.depth ?? 0"
        @updated="handleSubtaskUpdated"
        @deleted="handleSubtaskDeleted"
      />
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="!showAddForm && !loading" class="empty-state">
      <Icon name="mdi:clipboard-list-outline" size="48" />
      <p>Нет подзадач</p>
      <span class="empty-hint">Нажмите "Добавить", чтобы создать первую подзадачу</span>
    </div>

    <div v-if="loading && subtaskTree.length === 0" class="loading-state">
      <Icon name="mdi:loading" size="24" class="spin" />
      <span>Загрузка подзадач...</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useSubtasks } from '~/composables/boards/useSubtasks'
import { useSubtaskTree } from '~/composables/boards/useSubtaskTree'
import { useNotifications } from '~/composables/useNotifications'
import SubtaskItem from '../Subtasks/SubtaskItem.vue'
import type { Task, Subtask, SubtaskTree } from '~/types/boards'

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
// ✅ ИСПРАВЛЕНО: Деструктурируем ВСЕ нужные методы и состояния
// ============================================
const { 
  fetchSubtasks, 
  createSubtask,  // ✅ ДОБАВЛЕНО: метод создания
  subscribeToBoard, 
  unsubscribeFromBoard,
  loading,        // ✅ ДОБАВЛЕНО: состояние загрузки
  error           // ✅ ДОБАВЛЕНО: состояние ошибки
} = useSubtasks()

const { getTree, getTotalCount, getCompletedCount, clearTree } = useSubtaskTree()
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const showAddForm = ref(false)
const addingSubtask = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
const newSubtask = ref({
  title: '',
  description: ''
})

// ============================================
// COMPUTED - ID задачи и доски
// ============================================
const taskId = computed(() => props.task.id)
const boardId = computed(() => props.boardId ?? props.task?.boardId)

// ============================================
// COMPUTED - Дерево подзадач
// ============================================
const subtaskTree = computed<SubtaskTree[]>(() => {
  if (!taskId.value) return []
  return getTree(taskId.value)
})

/**
 * ✅ ИСПРАВЛЕНО: Общее количество подзадач ТОЛЬКО ПЕРВОГО УРОВНЯ
 */
const totalCount = computed(() => {
  if (!taskId.value) return 0
  // subtaskTree уже содержит только корневые подзадачи (parentId === null)
  return subtaskTree.value.length
})

/**
 * ✅ ИСПРАВЛЕНО: Количество завершённых подзадач ТОЛЬКО ПЕРВОГО УРОВНЯ
 */
const completedCount = computed(() => {
  if (!taskId.value) return 0
  // Считаем только корневые подзадачи
  return subtaskTree.value.filter(s => s.isCompleted).length
})

/**
 * Процент завершения (только первый уровень)
 */
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const canAdd = computed(() => {
  return newSubtask.value.title.trim().length > 0 &&
         newSubtask.value.title.trim().length <= 255
})

// ============================================
// METHODS
// ============================================
const loadSubtasks = async (taskId: number) => {
  console.log('[Subtasks] 📥 Loading subtasks for task:', taskId)
  try {
    await fetchSubtasks(taskId)
    console.log('[Subtasks] ✅ Subtasks loaded')
  } catch (error) {
    console.error('[Subtasks] ❌ Failed to load subtasks:', error)
  }
}

const cancelAdd = () => {
  showAddForm.value = false
  newSubtask.value = { title: '', description: '' }
}

const startAdd = async () => {
  showAddForm.value = true
  newSubtask.value = { title: '', description: '' }
  await nextTick()
  if (titleInputRef.value) {
    titleInputRef.value.focus()
  }
}

// ============================================
// METHODS - Создание подзадачи
// ============================================
const addSubtask = async () => {
  if (!canAdd.value || !taskId.value) return
  
  addingSubtask.value = true
  
  try {
    await createSubtask(taskId.value, {  // ✅ Теперь TS видит createSubtask
      title: newSubtask.value.title.trim(),
      description: newSubtask.value.description.trim() || undefined,
      parentId: null,
      order: 0
    })
    
    notifications.success('Подзадача добавлена')
    emit('updated')
    cancelAdd()
  } catch (error: any) {
    console.error('[SubtasksSection] Failed to create subtask:', error)
    const message = error.data?.message || 'Не удалось добавить подзадачу'
    notifications.error(message)
  } finally {
    addingSubtask.value = false
  }
}

// ============================================
// METHODS - Обработчики событий
// ============================================
const handleSubtaskUpdated = () => {
  console.log('[Subtasks] 🔄 Subtask updated')
  emit('updated')
}

const handleSubtaskDeleted = () => {
  console.log('[Subtasks] 🗑️ Subtask deleted')
  emit('updated')
}

// ============================================
// WATCHERS
// ============================================
watch(
  () => taskId.value,
  async (newTaskId, oldTaskId) => {
    console.log('[Subtasks] 👀 TaskId watch:', { oldTaskId, newTaskId })
    
    if (oldTaskId) {
      clearTree(oldTaskId)
    }
    
    if (newTaskId) {
      await loadSubtasks(newTaskId)
    }
  },
  { immediate: true }
)

watch(
  () => subtaskTree.value,
  (newTree) => {
    console.log('[SubtasksSection] Tree updated:', {
      taskId: taskId.value,
      rootCount: newTree?.length,
      totalCount: totalCount.value,
      completedCount: completedCount.value
    })
  },
  { deep: true }
)

watch(
  () => error.value,
  (newError) => {
    if (newError) {
      notifications.error(newError)
    }
  }
)

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  console.log('[Subtasks] 📦 Component mounted', {
    taskId: taskId.value,
    boardId: boardId.value
  })
  
  if (boardId.value) {
    subscribeToBoard(boardId.value)
    console.log('[Subtasks] 🔔 Subscribed to board:', boardId.value)
  }
})

onUnmounted(() => {
  console.log('[Subtasks] 🗑️ Component unmounted')
  
  if (boardId.value) {
    unsubscribeFromBoard(boardId.value)
  }
  
  if (taskId.value) {
    clearTree(taskId.value)
  }
})

// ============================================
// EXPOSE
// ============================================
defineExpose({
  startAdd,
  cancelAdd
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.task-section {
  background: #1e293b;
  border-radius: 12px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.section-title {
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

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  height: 24px;
  padding: 0 10px;
  background: #334155;
  color: #94a3b8;
  font-size: 12px;
  border-radius: 12px;
  font-weight: 600;
  margin-left: 8px;
}

// Прогресс-бар
.subtasks-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #0f172a;
  border-radius: 8px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #334155;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $blue, #7c3aed);
  border-radius: 4px;
  transition: width 0.3s ease;
  
  &.complete {
    background: linear-gradient(90deg, $green, #00d4aa);
  }
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  min-width: 80px;
  text-align: right;
}

// Форма добавления
.subtask-add-form {
  margin-bottom: 16px;
  padding: 16px;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid #334155;
}

.form-group {
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.form-control {
  width: 100%;
  padding: 12px;
  background: #1e293b;
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
}

textarea.form-control {
  resize: vertical;
  min-height: 60px;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

// Список подзадач
.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

// Пустое состояние
.empty-state {
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
    margin: 0 0 8px 0;
    font-size: 15px;
    color: #94a3b8;
  }
  
  .empty-hint {
    font-size: 13px;
    color: #64748b;
  }
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

// Анимации
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
  .task-section {
    padding: 16px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .section-title {
    flex-wrap: wrap;
  }
  
  .subtasks-progress {
    flex-wrap: wrap;
  }
  
  .progress-text {
    width: 100%;
    text-align: left;
    margin-top: 8px;
  }
}
</style>