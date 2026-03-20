<!-- app/components/pages/cabinet/Boards/Kanban/Column/AddColumnPlaceholder.vue -->
<template>
  <div
    class="add-column-placeholder"
    :class="{ 'is-editing': isEditing }"
    @click="startEditing"
  >
    <!-- ✅ РЕЖИМ ПРОСМОТРА: Кнопка "+" -->
    <template v-if="!isEditing">
      <div class="placeholder-content">
        <div class="placeholder-icon-wrapper">
          <Icon name="mdi:plus" size="32" class="placeholder-icon" />
        </div>
        <span class="placeholder-text">
          {{ isFirstColumn ? 'Создать первую колонку' : 'Добавить колонку' }}
        </span>
      </div>
    </template>

    <!-- ✅ РЕЖИМ РЕДАКТИРОВАНИЯ: Input для названия -->
    <template v-else>
      <div class="placeholder-form" @click.stop>
        <input
          ref="inputRef"
          v-model="columnName"
          type="text"
          class="form-input"
          placeholder="Название колонки..."
          maxlength="255"
          @keyup.enter="handleSubmit"
          @keyup.esc="cancelEditing"
          @blur="handleBlur"
          autofocus
        />
        <div class="form-actions">
          <button
            class="btn btn-save"
            @click="handleSubmit"
            :disabled="!canSubmit || isCreating"
            title="Создать"
          >
            <Icon v-if="isCreating" name="mdi:loading" size="18" class="spin" />
            <Icon v-else name="mdi:check" size="18" />
          </button>
          <button
            class="btn btn-cancel"
            @click="cancelEditing"
            :disabled="isCreating"
            title="Отмена"
          >
            <Icon name="mdi:close" size="18" />
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useColumns } from '~/composables/boards/useColumns'
import { useNotifications } from '~/composables/useNotifications'

// ============================================
// PROPS & EMITS
// ============================================
const props = defineProps<{
  boardId: number
  isFirstColumn?: boolean
}>()

const emit = defineEmits<{
  columnCreated: [columnId: number]
}>()

// ============================================
// COMPOSABLES
// ============================================
const { createColumn } = useColumns()  // ✅ Из composable
const notifications = useNotifications()

// ============================================
// STATE
// ============================================
const isEditing = ref(false)
const isCreating = ref(false)
const columnName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

// ============================================
// COMPUTED
// ============================================
const canSubmit = computed(() => {
  return columnName.value.trim().length > 0 && columnName.value.trim().length <= 255
})

// ============================================
// METHODS - Управление формой
// ============================================
const startEditing = async () => {
  isEditing.value = true
  columnName.value = ''
  
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
}

const cancelEditing = () => {
  isEditing.value = false
  columnName.value = ''
}

const handleBlur = (event: FocusEvent) => {
  const relatedTarget = event.relatedTarget as HTMLElement | null
  if (!relatedTarget || !relatedTarget.closest('.placeholder-form')) {
    if (canSubmit.value && !isCreating.value) {
      handleSubmit()
    } else {
      cancelEditing()
    }
  }
}

// ============================================
// ✅ METHODS - Создание колонки (ИСПРАВЛЕНО)
// ============================================
const handleSubmit = async () => {
  if (!canSubmit.value) return
  
  isCreating.value = true
  
  try {
    // ✅ Вызываем createColumn из composable с правильными аргументами
    const newColumn = await createColumn(props.boardId, {
      name: columnName.value.trim(),
      order: 0
    })
    
    notifications.success('Колонка создана')
    emit('columnCreated', newColumn.id)
    
    isEditing.value = false
    columnName.value = ''
  } catch (error: any) {
    console.error('[AddColumnPlaceholder] Failed to create column:', error)
    const message = error.data?.message || 'Не удалось создать колонку'
    notifications.error(message)
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/variables.scss' as *;

// ============================================
// ОСНОВНОЙ КОНТЕЙНЕР
// ============================================
.add-column-placeholder {
  min-width: 320px;
  max-width: 320px;
  height: fit-content;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.03);
  border: 2px dashed rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba($blue, 0.4);
    transform: translateY(-2px);
  }
  
  &.is-editing {
    border-color: $blue;
    background: rgba($blue, 0.05);
    cursor: default;
    transform: none;
  }
}

// ============================================
// РЕЖИМ ПРОСМОТРА
// ============================================
.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 16px;
  min-height: 200px;
}

.placeholder-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba($blue, 0.1);
  border-radius: 50%;
  transition: all 0.2s ease;
  
  .add-column-placeholder:hover & {
    background: rgba($blue, 0.2);
    transform: scale(1.1);
  }
}

.placeholder-icon {
  color: $blue;
  transition: all 0.2s ease;
  
  .add-column-placeholder:hover & {
    color: color.adjust($blue, $lightness: 10%);
  }
}

.placeholder-text {
  color: #94a3b8;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: color 0.2s ease;
  
  .add-column-placeholder:hover & {
    color: #cbd5e1;
  }
}

// ============================================
// РЕЖИМ РЕДАКТИРОВАНИЯ
// ============================================
.placeholder-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: $text-light;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &::placeholder {
    color: #64748b;
  }
  
  &:focus {
    outline: none;
    border-color: $blue;
    box-shadow: 0 0 0 3px rgba($blue, 0.15);
  }
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &.btn-save {
    background: rgba($blue, 0.2);
    color: $blue;
    border: 1px solid rgba($blue, 0.3);
    
    &:hover:not(:disabled) {
      background: rgba($blue, 0.3);
      border-color: $blue;
    }
  }
  
  &.btn-cancel {
    background: rgba(255, 255, 255, 0.05);
    color: #94a3b8;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.1);
      color: $text-light;
    }
  }
}

// ============================================
// АНИМАЦИИ
// ============================================
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// ============================================
// АДАПТИВНОСТЬ
// ============================================
@media (max-width: 768px) {
  .add-column-placeholder {
    min-width: 280px;
    max-width: 280px;
  }
  
  .placeholder-content {
    padding: 30px 16px;
    min-height: 180px;
  }
  
  .placeholder-icon-wrapper {
    width: 56px;
    height: 56px;
  }
  
  .placeholder-icon {
    size: 28px;
  }
  
  .placeholder-text {
    font-size: 13px;
  }
}
</style>