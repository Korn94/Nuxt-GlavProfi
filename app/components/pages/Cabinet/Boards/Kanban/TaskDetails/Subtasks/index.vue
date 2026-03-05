<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Subtasks/index.vue -->
<template>
  <div class="subtasks-root">
    <!-- Заголовок секции -->
    <div class="subtasks-header">
      <h3 class="subtasks-title">
        <Icon name="mdi:checkbox-marked-circle-outline" size="20" />
        Подзадачи
        <span class="subtasks-count">
          {{ completedCount }}/{{ totalCount }}
        </span>
      </h3>
      <button
        class="btn btn-sm btn-primary"
        @click="showAddForm = true"
        :disabled="addingSubtask || !canAddRootSubtask"
        title="Добавить подзадачу"
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
            maxlength="1000"
          ></textarea>
          <span class="char-count">{{ newSubtask.description.length }}/1000</span>
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

    <!-- Список подзадач (дерево) -->
    <div v-if="subtaskTree && subtaskTree.length > 0" class="subtasks-tree">
      <SubtaskItem
        v-for="subtask in subtaskTree"
        :key="subtask.id"
        :subtask="subtask"
        :task-id="taskId"
        :depth="subtask.depth ?? 0"
        @updated="handleSubtaskUpdated"
        @deleted="handleSubtaskDeleted"
      />
    </div>

    <!-- Пустое состояние -->
    <div v-else-if="!showAddForm" class="empty-state">
      <Icon name="mdi:clipboard-list-outline" size="48" />
      <p>Нет подзадач</p>
      <span class="empty-hint">
        Нажмите "Добавить", чтобы создать первую подзадачу
      </span>
    </div>

    <!-- Индикатор загрузки -->
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
import { useTasksStore } from 'stores/boards/tasks'
import SubtaskItem from './SubtaskItem.vue'
import type { Task, SubtaskTree } from '~/types/boards'
import { MAX_SUBTASK_DEPTH } from '~/types/boards'

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
// COMPOSABLES
// ============================================
const {
  fetchSubtasks,
  createSubtask,
  subscribeToBoard,
  unsubscribeFromBoard
} = useSubtasks()

const {
  getTree,
  getTotalCount,
  getCompletedCount,
  clearTree
} = useSubtaskTree()

const notifications = useNotifications()
const tasksStore = useTasksStore()

// ============================================
// STATE
// ============================================
const showAddForm = ref(false)
const addingSubtask = ref(false)
const loading = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)

const newSubtask = ref({
  title: '',
  description: ''
})

// ============================================
// COMPUTED - ID задачи и доски
// ============================================
const taskId = computed(() => props.task.id)

const boardId = computed(() => props.boardId ?? props.task.boardId)

// ============================================
// COMPUTED - Дерево подзадач
// ============================================
/**
 * Получаем дерево подзадач из useSubtaskTree
 * Дерево строится из flat-списка в subtasksStore
 */
const subtaskTree = computed<SubtaskTree[]>(() => {
  if (!taskId.value) return []
  return getTree(taskId.value)
})

/**
 * Общее количество подзадач первого уровня (по требованиям)
 */
const totalCount = computed(() => {
  if (!taskId.value) return 0
  // Считаем только корневые подзадачи (первый уровень)
  const rootSubtasks = subtaskTree.value
  return rootSubtasks.length
})

/**
 * Количество завершённых подзадач первого уровня (по требованиям)
 */
const completedCount = computed(() => {
  if (!taskId.value) return 0
  const rootSubtasks = subtaskTree.value
  return rootSubtasks.filter(s => s.isCompleted).length
})

/**
 * Процент завершения (только первый уровень)
 */
const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

/**
 * Можно ли добавить подзадачу (проверка формы)
 */
const canAdd = computed(() => {
  return newSubtask.value.title.trim().length > 0 &&
    newSubtask.value.title.trim().length <= 255
})

/**
 * Можно ли добавить корневую подзадачу (проверка глубины)
 * Всегда true для корневых (depth = 0)
 */
const canAddRootSubtask = computed(() => {
  return true // Корневые подзадачи всегда можно добавлять
})

// ============================================
// METHODS - Управление формой
// ============================================
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
    await createSubtask(taskId.value, {
      title: newSubtask.value.title.trim(),
      description: newSubtask.value.description.trim() || undefined,
      parentId: null, // Корневая подзадача
      order: 0
    })

    notifications.success('Подзадача добавлена')
    emit('updated')
    cancelAdd()

    // Обновляем задачу в tasksStore для синхронизации
    tasksStore.updateTaskSubtasksFromStore(taskId.value)
  } catch (error: any) {
    console.error('[SubtasksIndex] Failed to create subtask:', error)
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
  console.log('[SubtasksIndex] Subtask updated, emitting event')
  emit('updated')

  // Обновляем задачу в tasksStore для синхронизации
  tasksStore.updateTaskSubtasksFromStore(taskId.value)
}

const handleSubtaskDeleted = () => {
  console.log('[SubtasksIndex] Subtask deleted, emitting event')
  emit('updated')

  // Обновляем задачу в tasksStore для синхронизации
  tasksStore.updateTaskSubtasksFromStore(taskId.value)
}

// ============================================
// WATCHERS - Отслеживание изменений
// ============================================
watch(
  () => taskId.value,
  async (newTaskId, oldTaskId) => {
    // Очищаем кэш дерева для старой задачи
    if (oldTaskId) {
      clearTree(oldTaskId)
    }

    // Загружаем подзадачи для новой задачи
    if (newTaskId) {
      await loadSubtasks(newTaskId)
    }

    cancelAdd()
  },
  { immediate: true }
)

watch(
  () => subtaskTree.value,
  (newTree) => {
    console.log('[SubtasksIndex] Tree updated:', {
      taskId: taskId.value,
      rootCount: newTree?.length,
      totalCount: totalCount.value,
      completedCount: completedCount.value
    })
  },
  { deep: true }
)

// ============================================
// METHODS - Загрузка подзадач
// ============================================
const loadSubtasks = async (taskId: number) => {
  loading.value = true
  try {
    console.log(`[SubtasksIndex] 📥 Loading subtasks for task ${taskId}`)
    await fetchSubtasks(taskId)
    console.log(`[SubtasksIndex] ✅ Subtasks loaded for task ${taskId}`)
  } catch (error) {
    console.error(`[SubtasksIndex] ❌ Failed to load subtasks:`, error)
  } finally {
    loading.value = false
  }
}

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  // Подписка на обновления доски (real-time через Socket)
  if (boardId.value) {
    subscribeToBoard(boardId.value)
    console.log('[SubtasksIndex] Subscribed to board:', boardId.value)
  }

  // Загружаем подзадачи если task.id уже есть
  if (taskId.value) {
    loadSubtasks(taskId.value)
  }
})

onUnmounted(() => {
  // Отписка при уничтожении компонента
  if (boardId.value) {
    unsubscribeFromBoard(boardId.value)
  }

  // Очистка кэша дерева
  if (taskId.value) {
    clearTree(taskId.value)
  }

  console.log('[SubtasksIndex] Component unmounted, cleaned up')
})

// ============================================
// EXPOSE
// ============================================
defineExpose({
  startAdd,
  cancelAdd,
  loadSubtasks
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

.subtasks-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Заголовок
.subtasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #334155;
}

.subtasks-title {
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

.subtasks-count {
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
  padding: 16px;
  background: #0f172a;
  border-radius: 8px;
  border: 1px solid #334155;
}

.form-group {
  position: relative;
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

.char-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 11px;
  color: #64748b;
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #334155;
}

// Дерево подзадач
.subtasks-tree {
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

// Состояние загрузки
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
  color: #64748b;

  .icon {
    color: $blue;
  }

  span {
    font-size: 14px;
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
  .subtasks-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .subtasks-title {
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

  .form-actions {
    flex-direction: column;

    .btn {
      width: 100%;
    }
  }
}
</style>