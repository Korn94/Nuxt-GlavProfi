<!-- app/components/pages/cabinet/Contractors/ContractorOperations/EditModal.vue -->
<template>
  <PagesCabinetUiModal
    :visible="modelValue"
    title="Редактирование операции"
    size="md"
    closable
    @update:visible="$emit('update:modelValue', $event)"
  >
    <div class="edit-form">
      <!-- Сумма -->
      <div class="form-field">
        <label class="form-field__label">
          Сумма (₽) <span class="form-field__req">*</span>
        </label>
        <input
          v-model="localForm.amount"
          type="number"
          step="0.01"
          min="0"
          class="form-field__input"
          placeholder="Введите сумму"
        />
      </div>

      <!-- 🔧 НОВОЕ: Тип работы (только для income-операций — оплаченных работ) -->
      <div v-if="operation?.type === 'income'" class="form-field">
        <label class="form-field__label">Тип работы</label>
        <select v-model="localForm.workTypes" class="form-field__input">
          <option v-for="type in WORK_TYPES" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
      </div>

      <!-- Тип расхода (только для расходов) -->
      <div v-if="operation?.type === 'expense'" class="form-field">
        <label class="form-field__label">Тип расхода</label>
        <select v-model="localForm.expenseType" class="form-field__input">
          <option v-for="type in EXPENSE_TYPES" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <span class="form-field__hint">
          <Icon name="mdi:alert-outline" size="12" />
          Изменение типа может повлиять на баланс контрагента
        </span>
      </div>

      <!-- Комментарий -->
      <div class="form-field">
        <label class="form-field__label">Комментарий</label>
        <textarea
          v-model="localForm.comment"
          class="form-field__input form-field__input--textarea"
          rows="3"
          placeholder="Добавьте комментарий..."
        />
      </div>

      <!-- 🔧 ИСПРАВЛЕНО: Дата без времени (date вместо datetime-local) -->
      <div class="form-field">
        <label class="form-field__label">Дата операции</label>
        <input
          v-model="localForm.date"
          type="date"
          class="form-field__input"
        />
      </div>
    </div>

    <template #footer>
      <button
        class="crm-btn crm-btn--ghost"
        @click="$emit('update:modelValue', false)"
        :disabled="saving"
      >
        Отмена
      </button>
      <button
        class="crm-btn crm-btn--accent"
        @click="handleSave"
        :disabled="saving"
      >
        <Icon v-if="saving" name="mdi:loading" class="spin" size="14" />
        {{ saving ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// ── Константы ─────────────────────────────────────────────────────────
const EXPENSE_TYPES = [
  { value: 'Работа', label: 'Работа' },
  { value: 'Зарплата', label: 'Зарплата' },
  { value: 'Топливо', label: 'Топливо' },
  { value: 'Налог', label: 'Налог' },
  { value: 'Реклама', label: 'Реклама' },
  { value: 'Кредит', label: 'Кредит' },
  { value: 'ГлавПрофи', label: 'ГлавПрофи' }
] as const

// 🔧 НОВОЕ: Типы работ (из схемы БД works.workTypes)
const WORK_TYPES = [
  { value: 'Отделка', label: 'Отделка' },
  { value: 'Электрика', label: 'Электрика' },
  { value: 'Плитка', label: 'Плитка' },
  { value: 'Сантехника', label: 'Сантехника' },
  { value: 'Перегородки ГКЛ', label: 'Перегородки ГКЛ' },
  { value: 'Потолок', label: 'Потолок' },
  { value: 'Сварка', label: 'Сварка' },
  { value: 'Бетонные работы', label: 'Бетонные работы' },
  { value: 'Кровля', label: 'Кровля' },
  { value: 'Фасад', label: 'Фасад' },
  { value: 'Перегородки Камень', label: 'Перегородки Камень' },
  { value: 'Демонтаж', label: 'Демонтаж' },
  { value: 'Мусор', label: 'Мусор' },
  { value: 'Разнорабочий', label: 'Разнорабочий' },
  { value: 'Смежники', label: 'Смежники' },
  { value: 'Подневка', label: 'Подневка' },
  { value: 'Прочее', label: 'Прочее' }
] as const

// ── Типы ──────────────────────────────────────────────────────────────
interface Operation {
  id: number
  type: 'expense' | 'income'
  title: string
  amount: number
  date: string
  object?: string
  objectId?: number
  comment?: string
  expenseType?: string
  workTypes?: string // 🔧 НОВОЕ: тип работы
}

interface EditFormData {
  amount: number
  comment: string
  date: string
  expenseType: string
  workTypes: string // 🔧 НОВОЕ
}

// ── Props / Emits ─────────────────────────────────────────────────────
const props = defineProps<{
  modelValue: boolean
  operation: Operation | null
  saving: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [form: EditFormData]
}>()

// ── Локальное состояние формы ─────────────────────────────────────────
const localForm = ref<EditFormData>({
  amount: 0,
  comment: '',
  date: '',
  expenseType: 'Работа',
  workTypes: 'Прочее'
})

// ── Синхронизация при открытии модалки ────────────────────────────────
watch(
  () => props.operation,
  (operation) => {
    if (!operation) return

    const date = new Date(operation.date)
    // 🔧 ИСПРАВЛЕНО: только дата (YYYY-MM-DD) без времени
    const formattedDate = isNaN(date.getTime())
      ? ''
      : date.toISOString().slice(0, 10)

    localForm.value = {
      amount: operation.amount,
      comment: operation.comment || '',
      date: formattedDate,
      expenseType: operation.expenseType || 'Работа',
      workTypes: operation.workTypes || 'Прочее'
    }
  },
  { immediate: true }
)

// ── Валидация и отправка ──────────────────────────────────────────────
function handleSave() {
  if (!localForm.value.amount || localForm.value.amount <= 0) {
    alert('Сумма должна быть больше нуля')
    return
  }

  if (!localForm.value.date) {
    alert('Укажите дату операции')
    return
  }

  emit('save', { ...localForm.value })
}
</script>

<style lang="scss" scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__label {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }

  &__req {
    color: var(--crm-danger);
  }

  &__hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-warning, #f5a623);
    font-style: italic;
  }

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-md);
    font-family: var(--crm-font-sans);
    padding: 9px 12px;
    outline: none;
    transition: var(--crm-transition);
    width: 100%;

    &::placeholder {
      color: var(--crm-text-disabled);
    }

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }

    &--textarea {
      resize: vertical;
      min-height: 80px;
    }

    color-scheme: dark;

    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}

.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 9px 16px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-md);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);
  border: none;
  white-space: nowrap;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--ghost {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-overlay);
      color: var(--crm-text-primary);
    }
  }

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.25);
    }
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>