<!-- app\components\pages\cabinet\Contractors\ContractorForm.vue -->
<!-- Форма создания/редактирования контрагента -->
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

      <!-- Баланс -->
      <div class="form-field">
        <label class="form-field__label">Баланс <span class="form-field__req">*</span></label>
        <div class="balance-input">
          <input 
            v-model="displayBalance" 
            type="text" 
            class="form-field__input"
            :class="{ 'form-field__input--error': errors.balance }"
            placeholder="0.00"
            @blur="formatBalance"
            @focus="unfocusBalance"
            @input="syncBalance"
          />
          <span class="balance-input__currency">₽</span>
        </div>
        <span v-if="errors.balance" class="form-field__error">{{ errors.balance }}</span>
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

    <!-- Пользователь (если нужно связывать) -->
    <div v-if="showUserSelect" class="form-field form-field--full">
      <label class="form-field__label">Пользователь системы</label>
      <div class="user-select">
        <button 
          v-if="form.userId" 
          class="user-select__clear"
          @click="form.userId = null"
          title="Удалить связь"
        >
          <Icon name="mdi:close" size="14" />
        </button>
        <select 
          v-model.number="form.userId" 
          class="form-field__input"
          @change="clearError('userId')"
        >
          <option :value="null">— Не привязан —</option>
          <option v-for="user in availableUsers" :key="user.id" :value="user.id">
            {{ user.name }} ({{ user.login }})
          </option>
        </select>
      </div>
      <span v-if="errors.userId" class="form-field__error">{{ errors.userId }}</span>
    </div>

    <!-- Сообщение об ошибке формы -->
    <div v-if="errors.form" class="form-error">
      <Icon name="mdi:alert-circle-outline" size="14" />
      {{ errors.form }}
    </div>

    <!-- Информация о создании/обновлении -->
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
  availableUsers?: Array<{ id: number; name: string; login: string }>
  showUserSelect?: boolean
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
  userId: number | null
}>({
  name: '',
  phone: null,
  comment: null,
  balance: '0.00',
  userId: null
})

const displayBalance = ref('0.00')

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
        userId: contractor.userId || null
      }
      displayBalance.value = formatCurrency(contractor.balance)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// ── Всп��могательные функции ─────────────────────────────────────────
function formatCurrency(amount: string | number): string {
  const num = parseFloat(String(amount)) || 0
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function parseNumber(str: string): number {
  if (!str) return 0
  return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.'))
}

function formatBalance() {
  const num = parseNumber(displayBalance.value)
  if (!isNaN(num)) {
    form.value.balance = num.toFixed(2)
    displayBalance.value = formatCurrency(form.value.balance)
  }
}

function unfocusBalance() {
  displayBalance.value = form.value.balance || '0.00'
}

function syncBalance() {
  const num = parseNumber(displayBalance.value)
  if (!isNaN(num)) {
    form.value.balance = num.toFixed(2)
  }
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
    userId: null
  }
  displayBalance.value = '0.00'
  errors.value = {}
}

// ── Валидация ───────────────────────────────────────────────────────
function validate(): boolean {
  errors.value = {}

  // Имя
  if (!form.value.name || form.value.name.trim().length === 0) {
    errors.value.name = 'Имя обязательно'
  } else if (form.value.name.length > 255) {
    errors.value.name = 'Имя не может быть длиннее 255 символов'
  }

  // Телефон
  if (form.value.phone && form.value.phone.length > 255) {
    errors.value.phone = 'Телефон не может быть длиннее 255 символов'
  }

  // Баланс
  const balance = parseNumber(String(form.value.balance))
  if (isNaN(balance)) {
    errors.value.balance = 'Баланс должен быть числом'
  }

  // Комментарий
  if (form.value.comment && form.value.comment.length > 1000) {
    errors.value.comment = 'Комментарий не может быть длиннее 1000 символов'
  }

  return Object.keys(errors.value).length === 0
}

// ── Отправка ────────────────────────────────────────────────────────
function handleSubmit() {
  if (!validate()) return

  const data: ContractorCreateInput = {
    name: form.value.name.trim(),
    phone: form.value.phone || null,
    comment: form.value.comment || null,
    balance: form.value.balance, // ✅ Уже строка
    userId: form.value.userId || null
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

    // Для select
    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }

    color-scheme: dark;
  }

  &__error {
    font-size: var(--crm-text-xs);
    color: var(--crm-danger);
    margin-top: 2px;
  }
}

// ── Баланс ────────────────────────────────────────────────────────
.balance-input {
  position: relative;
  display: flex;
  align-items: center;

  &__currency {
    position: absolute;
    right: 12px;
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-muted);
    pointer-events: none;
  }

  .form-field__input {
    padding-right: 32px;
  }
}

// ── Выбор пользователя ────────────────────────────────────────────
.user-select {
  position: relative;
  display: flex;
  align-items: center;

  &__clear {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: var(--crm-text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: var(--crm-transition);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;

    &:hover {
      background: var(--crm-bg-overlay);
      color: var(--crm-danger);
    }
  }

  .form-field__input {
    padding-right: 36px;
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