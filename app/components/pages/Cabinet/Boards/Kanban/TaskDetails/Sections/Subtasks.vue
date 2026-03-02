<!-- app/components/pages/cabinet/Boards/Kanban/TaskDetails/Sections/Subtasks.vue -->
<template>
  <div class="task-section subtasks-section">
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
    
    <!-- Прогресс-бар -->
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
    
    <!-- Форма добавления подзадачи -->
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
    
    <!-- ✅ ИСПРАВЛЕНО: Используем taskWithSubtasks вместо props.task -->
    <div v-if="taskWithSubtasks?.subtasks && taskWithSubtasks.subtasks.length > 0" class="subtasks-list">
      <SubtaskItem
        v-for="subtask in taskWithSubtasks.subtasks"
        :key="subtask.id"
        :subtask="subtask"
        :task-id="taskWithSubtasks.id"
        @updated="$emit('updated')"
        @deleted="$emit('updated')"
      />
    </div>
    
    <!-- Пустое состояние -->
    <div v-else-if="!showAddForm" class="empty-state">
      <Icon name="mdi:clipboard-list-outline" size="48" />
      <p>Нет подзадач</p>
      <span class="empty-hint">Нажмите "Добавить", чтобы создать первую подзадачу</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useSubtasks } from '~/composables/boards/useSubtasks'
import { useTasksStore } from 'stores/boards/tasks'
import { useNotifications } from '~/composables/useNotifications'
import SubtaskItem from '../Subtasks/SubtaskItem.vue'
import type { Task, Subtask } from '~/types/boards'

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
const { createSubtask, subscribeToTask, unsubscribeFromTask } = useSubtasks()
const tasksStore = useTasksStore()
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
// ✅ КРИТИЧЕСКИ ВАЖНО: Получаем задачу из tasksStore
// ============================================
const taskWithSubtasks = computed(() => {
  // ✅ Ищем актуальную задачу в tasksStore
  const storeTask = tasksStore.tasks.find(t => t.id === props.task.id)
  
  // ✅ Если нашли в сторе - используем её
  if (storeTask) {
    return storeTask
  }
  
  // ✅ Фоллбэк на props, но с предупреждением
  console.warn('[SubtasksSection] Task not found in store, using props:', props.task.id)
  return props.task
})

// ============================================
// COMPUTED
// ============================================
const totalCount = computed(() => {
  if (!taskWithSubtasks.value?.subtasks) return 0
  return countAllSubtasks(taskWithSubtasks.value.subtasks)
})

const completedCount = computed(() => {
  if (!taskWithSubtasks.value?.subtasks) return 0
  return countCompletedSubtasks(taskWithSubtasks.value.subtasks)
})

const progressPercent = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const canAdd = computed(() => {
  return newSubtask.value.title.trim().length > 0
})

// ============================================
// METHODS - Подсчёт подзадач
// ============================================
const countAllSubtasks = (subtasks: Subtask[]): number => {
  let count = 0
  subtasks.forEach(subtask => {
    count++
    if (subtask.subtasks && subtask.subtasks.length > 0) {
      count += countAllSubtasks(subtask.subtasks)
    }
  })
  return count
}

const countCompletedSubtasks = (subtasks: Subtask[]): number => {
  let count = 0
  subtasks.forEach(subtask => {
    if (subtask.isCompleted) count++
    if (subtask.subtasks && subtask.subtasks.length > 0) {
      count += countCompletedSubtasks(subtask.subtasks)
    }
  })
  return count
}

// ============================================
// METHODS - Управление подзадачами
// ============================================
const cancelAdd = () => {
  showAddForm.value = false
  newSubtask.value = { title: '', description: '' }
}

const addSubtask = async () => {
  if (!canAdd.value) return
  
  addingSubtask.value = true
  
  try {
    await createSubtask(props.task.id, {
      title: newSubtask.value.title.trim(),
      description: newSubtask.value.description.trim() || undefined,
      parentId: null,
      order: 0
    })
    
    notifications.success('Подзадача добавлена')
    emit('updated')
    cancelAdd()
  } catch (error) {
    console.error('Failed to create subtask:', error)
    notifications.error('Не удалось добавить подзадачу')
  } finally {
    addingSubtask.value = false
  }
}

// ============================================
// WATCHERS - Отслеживаем изменения задачи в сторе
// ============================================
watch(
  () => taskWithSubtasks.value?.subtasks,
  (newSubtasks) => {
    console.log('[DEBUG SubtasksSection] Subtasks updated:', {
      taskId: taskWithSubtasks.value?.id,
      count: newSubtasks?.length,
      firstSubtaskId: newSubtasks?.[0]?.id
    })
    emit('updated')
  },
  { deep: true, immediate: true }
)

// ============================================
// LIFECYCLE
// ============================================
onMounted(() => {
  subscribeToTask(props.task.id)
})

onUnmounted(() => {
  unsubscribeFromTask(props.task.id)
})

watch(() => props.task.id, () => {
  cancelAdd()
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
    background: lighten($blue, 5%);
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