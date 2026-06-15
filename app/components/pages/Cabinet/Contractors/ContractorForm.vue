<!-- app/components/pages/cabinet/Contractors/ContractorForm.vue -->
<template>
  <div class="contractor-form">

    <!-- ═══════════════════════════ FORM FIELDS ═════════════════════ -->
    <div class="form-grid">

      <!-- Имя -->
      <div class="form-field form-field--full">
        <label class="form-field__label">Имя <span class="form-field__req">*</span></label>
        <input 
          v-model="form.name" 
          type="text" 
          class="form-field__input"
          :class="{ 'form-field__input--error': errors.name }"
          placeholder="ФИО или название организации"
          @input="clearError('name')"
        />
        <span v-if="errors.name" class="form-field__error">{{ errors.name }}</span>
      </div>

      <!-- Телефон -->
      <div class="form-field">
        <label class="form-field__label">Телефон</label>
        <input 
          v-model="form.phone" 
          type="tel" 
          class="form-field__input"
          placeholder="+7 (999) 123-45-67"
          @input="clearError('phone')"
        />
        <span v-if="errors.phone" class="form-field__error">{{ errors.phone }}</span>
      </div>

      <!-- 🔧 Баланс — только для просмотра (рассчитывается автоматически) -->
      <div class="form-field">
        <label class="form-field__label">Баланс</label>
        <div class="balance-readonly">
          <span :class="['balance-readonly__value', getBalanceClass(form.balance)]">
            {{ formatCurrency(form.balance) }}
          </span>
          <span class="balance-readonly__hint">
            <Icon name="mdi:calculator" size="11" />
            Рассчитывается автоматически
          </span>
        </div>
      </div>

      <!-- ✅ Переключатель «Активен» -->
      <div class="form-field">
        <label class="form-field__label">Статус</label>
        <label class="toggle">
          <input 
            type="checkbox" 
            v-model="form.isActive" 
            class="toggle__input"
          />
          <span class="toggle__track">
            <span class="toggle__thumb" />
          </span>
          <span class="toggle__label">{{ form.isActive ? 'Активен' : 'В архиве' }}</span>
        </label>
      </div>

    </div>

    <!-- Комментарий -->
    <div class="form-field form-field--full">
      <label class="form-field__label">Заметка</label>
      <textarea 
        v-model="form.comment" 
        class="form-field__input form-field__input--textarea"
        placeholder="Дополнительная информация о контрагенте..."
        rows="3"
        @input="clearError('comment')"
      />
      <span v-if="errors.comment" class="form-field__error">{{ errors.comment }}</span>
    </div>

    <!-- Сообщение об ошибке формы -->
    <div v-if="errors.form" class="form-error">
      <Icon name="mdi:alert-circle-outline" size="14" />
      {{ errors.form }}
    </div>

    <!-- Информация о создании/обновлении (только при редактировании) -->
    <div v-if="contractor && contractor.createdAt" class="form-meta">
      <span class="form-meta__item">
        <Icon name="mdi:calendar-outline" size="12" />
        Создан: {{ formatDate(contractor.createdAt) }}
      </span>
      <span v-if="contractor.updatedAt" class="form-meta__item">
        <Icon name="mdi:pencil-outline" size="12" />
        Изменён: {{ formatDate(contractor.updatedAt) }}
      </span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { ContractorType, ContractorDTO, ContractorCreateInput, ContractorUpdateInput } from '~/types/contractors'

const props = defineProps<{
  contractor?: ContractorDTO | null
  type: ContractorType
}>()

const emit = defineEmits<{
  'update:form': [value: ContractorCreateInput | ContractorUpdateInput]
  'submit': []
}>()

// ── Состояние ───────────────────────────────────────────────────────
const form = ref<{
  name: string
  phone: string | null
  comment: string | null
  balance: string
  isActive: boolean
}>({
  name: '',
  phone: null,
  comment: null,
  balance: '0.00',
  isActive: true
})

const errors = ref<Record<string, string>>({})

// ── Инициализация ───────────────────────────────────────────────────
watch(
  () => props.contractor,
  (contractor) => {
    if (contractor) {
      form.value = {
        name: contractor.name,
        phone: contractor.phone || null,
        comment: contractor.comment || null,
        balance: String(contractor.balance),
        isActive: contractor.isActive ?? true
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// ── Вспомогательные функции ─────────────────────────────────────────
function formatCurrency(amount: string | number): string {
  const num = parseFloat(String(amount)) || 0
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

function getBalanceClass(balance: string | number): string {
  const num = parseFloat(String(balance))
  if (num > 0) return 'balance-readonly__value--positive'
  if (num < 0) return 'balance-readonly__value--negative'
  return 'balance-readonly__value--neutral'
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return '—'
  }
}

function clearError(field: string) {
  if (errors.value[field]) {
    delete errors.value[field]
  }
}

function resetForm() {
  form.value = {
    name: '',
    phone: null,
    comment: null,
    balance: '0.00',
    isActive: true
  }
  errors.value = {}
}

// ── Валидация ───────────────────────────────────────────────────────
function validate(): boolean {
  errors.value = {}

  if (!form.value.name || form.value.name.trim().length === 0) {
    errors.value.name = 'Имя обязательно'
  } else if (form.value.name.length > 255) {
    errors.value.name = 'Имя не может быть длиннее 255 символов'
  }

  if (form.value.phone && form.value.phone.length > 255) {
    errors.value.phone = 'Телефон не может быть длиннее 255 символов'
  }

  if (form.value.comment && form.value.comment.length > 1000) {
    errors.value.comment = 'Комментарий не может быть длиннее 1000 символов'
  }

  return Object.keys(errors.value).length === 0
}

// ── Отправка ────────────────────────────────────────────────────────
function handleSubmit() {
  if (!validate()) return

  // 🔧 Исключаем balance из данных — он рассчитывается автоматически
  const { balance, ...dataWithoutBalance } = form.value
  
  const data: ContractorCreateInput & { isActive?: boolean } = {
    name: dataWithoutBalance.name.trim(),
    phone: dataWithoutBalance.phone || null,
    comment: dataWithoutBalance.comment || null,
    isActive: dataWithoutBalance.isActive
  }

  emit('update:form', data)
  emit('submit')
}

// ── Expose для родителя ────────────────────────────────────────────
defineExpose({
  form: computed(() => form.value),
  validate,
  resetForm,
  handleSubmit
})
</script>

<style lang="scss" scoped>
.contractor-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// ── Сетка формы ────────────────────────────────────────────────────
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

// ── Поле формы ────────────────────────────────────────────────────
.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;

  &--full {
    grid-column: 1 / -1;
  }

  &__label {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }

  &__req {
    color: var(--crm-danger);
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

    &--error {
      border-color: var(--crm-danger);

      &:focus {
        box-shadow: 0 0 0 3px var(--crm-danger-dim);
      }
    }

    &--textarea {
      resize: vertical;
      min-height: 80px;
      font-family: var(--crm-font-sans);
    }

    color-scheme: dark;
  }

  &__error {
    font-size: var(--crm-text-xs);
    color: var(--crm-danger);
    margin-top: 2px;
  }
}

// 🔧 Баланс только для просмотра
.balance-readonly {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    font-family: var(--crm-font-mono);

    &--positive {
      color: var(--crm-success);
    }

    &--negative {
      color: var(--crm-danger);
    }

    &--neutral {
      color: var(--crm-text-primary);
    }
  }

  &__hint {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    font-style: italic;
  }
}

// ✅ Переключатель «Активен»
.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;

  &__input {
    display: none;
  }

  &__track {
    position: relative;
    width: 44px;
    height: 24px;
    background: var(--crm-bg-overlay);
    border: 1px solid var(--crm-border-hover);
    border-radius: 12px;
    transition: var(--crm-transition);
    flex-shrink: 0;

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      background: var(--crm-text-muted);
      border-radius: 50%;
      transition: var(--crm-transition);
    }
  }

  &__thumb {
    display: none;
  }

  &__label {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-secondary);
  }

  // Состояние: включено
  &__input:checked + &__track {
    background: var(--crm-success-dim);
    border-color: rgba(61, 214, 140, 0.3);

    &::after {
      left: calc(100% - 20px);
      background: var(--crm-success);
    }
  }

  &__input:checked ~ &__label {
    color: var(--crm-success);
  }
}

// ── Ошибка формы ──────────────────────────────────────────────────
.form-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  border-radius: var(--crm-radius-md);
  color: var(--crm-danger);
  font-size: var(--crm-text-sm);
}

// ── Метаинформация ────────────────────────────────────────────────
.form-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);
}

.form-meta__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-family: var(--crm-font-mono);
}

// ── Responsive ────────────────────────────────────────────────────
@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field {
    &--full {
      grid-column: 1;
    }
  }
}
</style>