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
    <div v-else-if="!showAddForm && !loading" class="empty-state">
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
  unsubscribeFromBoard,
  loading,        // ✅ ИМПОРТИРОВАНО из useSubtasks
  error           // ✅ ИМПОРТИРОВАНО из useSubtasks
} = useSubtasks()

const {
  getTree,
  getTotalCount,
  getCompletedCount,
  clearTree
} = useSubtaskTree()

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
 * ✅ ИСПРАВЛЕНО: Общее количество подзадач ТОЛЬКО ПЕРВОГО УРОВНЯ
 */
const totalCount = computed(() => {
  if (!taskId.value) return 0
  // Считаем только корневые подзадачи (первый уровень)
  return subtaskTree.value.length
})

/**
 * ✅ ИСПРАВЛЕНО: Количество завершённых подзадач ТОЛЬКО ПЕРВОГО УРОВНЯ
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
}

const handleSubtaskDeleted = () => {
  console.log('[SubtasksIndex] Subtask deleted, emitting event')
  emit('updated')
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
  try {
    console.log(`[SubtasksIndex] 📥 Loading subtasks for task ${taskId}`)
    await fetchSubtasks(taskId)
    console.log(`[SubtasksIndex] ✅ Subtasks loaded for task ${taskId}`)
  } catch (error) {
    console.error(`[SubtasksIndex] ❌ Failed to load subtasks:`, error)
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
  
  &:hover {
    background: color.adjust($blue, $lightness: -5%);
  }
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