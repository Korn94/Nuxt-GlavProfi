--- app/components/pages/Cabinet/Operation/EditExpense.vue (原始)


+++ app/components/pages/Cabinet/Operation/EditExpense.vue (修改后)
<!-- app/components/pages/Cabinet/Operation/EditExpense.vue -->
<template>
  <PagesCabinetUiModal :visible="isOpen" title="Редактировать расход" size="md" closable @close="close">
    <div class="op-form">

      <!-- Тип расхода -->
      <div class="field">
        <label class="field__label">Тип расхода</label>
        <div class="type-grid">
          <button v-for="type in expenseTypes" :key="type.value" class="type-btn"
            :class="{ 'type-btn--active': selectedType === type.value }" @click="selectType(type.value)">
            <Icon :name="type.icon" size="15" />
            {{ type.label }}
          </button>
        </div>
      </div>

      <!-- Сумма -->
      <div class="field">
        <label class="field__label">Сумма <span class="field__req">*</span></label>
        <input type="text" class="field__input" :class="{ 'field__input--error': errors.amount }"
          v-model="displayAmount" placeholder="0" @blur="formatOnBlur" @focus="unformatOnFocus" @input="syncAmount" />
        <span v-if="errors.amount" class="field__error">{{ errors.amount }}</span>
      </div>

      <!-- Дата -->
      <div class="field">
        <label class="field__label">Дата операции <span class="field__req">*</span></label>
        <input type="date" class="field__input" :class="{ 'field__input--error': errors.operationDate }"
          v-model="form.operationDate" />
        <span v-if="errors.operationDate" class="field__error">{{ errors.operationDate }}</span>
      </div>

      <!-- Контрагент (для Работа / Зарплата / Топливо) -->
      <template v-if="needsContractor">
        <div class="field">
          <label class="field__label">Категория контрагента <span class="field__req">*</span></label>
          <select class="field__input" :class="{ 'field__input--error': errors.contractorType }"
            v-model="form.contractorType">
            <option value="">— Выберите категорию —</option>
            <option value="worker">Разнорабочий</option>
            <option value="master">Мастер</option>
            <option value="foreman">Прораб</option>
            <option value="office">Офис</option>
          </select>
          <span v-if="errors.contractorType" class="field__error">{{ errors.contractorType }}</span>
        </div>

        <div class="field">
          <label class="field__label">Контрагент <span class="field__req">*</span></label>
          <select class="field__input" :class="{ 'field__input--error': errors.contractorId }"
            v-model="form.contractorId">
            <option value="">— Выберите контрагента —</option>
            <option v-for="c in contractorsByType" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select>
          <span v-if="errors.contractorId" class="field__error">{{ errors.contractorId }}</span>
        </div>
      </template>

      <!-- Объект (для Работа / Налог) -->
      <div v-if="needsObject" class="field">
        <label class="field__label">Объект</label>
        <select class="field__input" v-model="form.objectId">
          <option value="">— Без объекта —</option>
          <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
      </div>

      <!-- Комментарий -->
      <div class="field">
        <label class="field__label">Комментарий</label>
        <textarea class="field__input field__input--textarea" v-model="form.comment"
          placeholder="Дополнительная информация..." rows="2" />
      </div>

      <!-- Ошибка формы -->
      <div v-if="errors.form" class="form-error">
        <Icon name="mdi:alert-circle-outline" size="14" />
        {{ errors.form }}
      </div>

    </div>

    <template #footer>
      <button class="crm-btn crm-btn--ghost" @click="close" :disabled="loading">
        Отмена
      </button>
      <button class="crm-btn crm-btn--primary" @click="submitExpense" :disabled="loading">
        <Icon v-if="loading" name="mdi:loading" class="spin" size="14" />
        {{ loading ? 'Сохранение...' : 'Сохранить' }}
      </button>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  expenseId?: number | null
}>()

const emit = defineEmits<{
  close: []
  'expense-updated': [result: any]
}>()

// ── Справочники ─────────────────────────────────────────────────────
const expenseTypes = [
  { value: 'Работа', label: 'Работа', icon: 'mdi:hammer' },
  { value: 'Налог', label: 'Налог', icon: 'mdi:currency-usd' },
  { value: 'Зарплата', label: 'Зарплата', icon: 'mdi:cash' },
  { value: 'Реклама', label: 'Реклама', icon: 'mdi:bullhorn' },
  { value: 'Кредит', label: 'Кредит', icon: 'mdi:bank' },
  { value: 'Топливо', label: 'Топливо', icon: 'mdi:gas-station' },
  { value: 'ГлавПрофи', label: 'ГлавПрофи', icon: 'mdi:star' },
]

// ── Состояние ───────────────────────────────────────────────────────
const selectedType = ref('')
const loading = ref(false)
const errors = ref<Record<string, string>>({})
const contractors = ref<any[]>([])
const objects = ref<any[]>([])
const localDisplay = ref('')

const form = ref({
  amount: null as number | null,
  contractorType: '',
  contractorId: '',
  objectId: '',
  comment: '',
  expenseType: '',
  operationDate: new Date().toISOString().split('T')[0],
})

// ── Computed ────────────────────────────────────────────────────────
const needsContractor = computed(() => ['Работа', 'Зарплата', 'Топливо'].includes(selectedType.value))
const needsObject = computed(() => ['Работа', 'Налог'].includes(selectedType.value))

const contractorsByType = computed(() =>
  contractors.value.filter(c => c.type === form.value.contractorType)
)

const displayAmount = computed({
  get() {
    if (form.value.amount === null) return ''
    return new Intl.NumberFormat('ru-RU').format(form.value.amount)
  },
  set(value: string) { localDisplay.value = value }
})

// ── Форматирование суммы ─────────────────────────────────────────────
function parseNumber(str: string) {
  if (!str) return NaN
  return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.'))
}

function unformatOnFocus() {
  localDisplay.value = form.value.amount !== null ? String(form.value.amount) : ''
}

function formatOnBlur() {
  const num = parseNumber(localDisplay.value)
  if (!isNaN(num) && num >= 0) {
    form.value.amount = num
  }
}

function syncAmount() {
  const num = parseNumber(localDisplay.value)
  if (!isNaN(num)) form.value.amount = num
  else if (!localDisplay.value) form.value.amount = null
}

// ── Методы ──────────────────────────────────────────────────────────
function selectType(type: string) {
  selectedType.value = type
  form.value.expenseType = type
  // Не сбрасываем контрагента и объект при смене типа
}

async function loadData() {
  try {
    const [workerRes, masterRes, foremanRes, officeRes, objs] = await Promise.all([
      $fetch<any>('/api/contractors/worker', { credentials: 'include' }),
      $fetch<any>('/api/contractors/master', { credentials: 'include' }),
      $fetch<any>('/api/contractors/foreman', { credentials: 'include' }),
      $fetch<any>('/api/contractors/office', { credentials: 'include' }),
      $fetch<any[]>('/api/objects', { credentials: 'include' }),
    ])

    const workers = workerRes?.contractors || workerRes || []
    const masters = masterRes?.contractors || masterRes || []
    const foremans = foremanRes?.contractors || foremanRes || []
    const offices = officeRes?.contractors || officeRes || []

    contractors.value = [
      ...workers.map((w: any) => ({ ...w, type: 'worker' })),
      ...masters.map((m: any) => ({ ...m, type: 'master' })),
      ...foremans.map((f: any) => ({ ...f, type: 'foreman' })),
      ...offices.map((o: any) => ({ ...o, type: 'office' })),
    ]
    objects.value = objs || []
  } catch (e) {
    console.error('[EditExpense] Ошибка загрузки данных:', e)
  }
}

async function loadExpenseData() {
  if (!props.expenseId) return

  try {
    const expense = await $fetch<any>(`/api/expenses/${props.expenseId}`, { credentials: 'include' })

    form.value = {
      amount: expense.amount,
      contractorType: expense.contractorType || '',
      contractorId: expense.contractorId || '',
      objectId: expense.objectId || '',
      comment: expense.comment || '',
      expenseType: expense.expenseType || '',
      operationDate: expense.operationDate ? new Date(expense.operationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    }

    selectedType.value = expense.expenseType || ''
  } catch (e) {
    console.error('[EditExpense] Ошибка загрузки расхода:', e)
    errors.value.form = 'Не удалось загрузить данные расхода'
  }
}

function validate() {
  errors.value = {}
  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Сумма обязательна и должна быть больше нуля'
  }
  if (!form.value.operationDate) {
    errors.value.operationDate = 'Дата операции обязательна'
  }
  if (needsContractor.value) {
    if (!form.value.contractorType) errors.value.contractorType = 'Выберите категорию контрагента'
    if (!form.value.contractorId) errors.value.contractorId = 'Выберите контрагента'
  }
  return Object.keys(errors.value).length === 0
}

async function submitExpense() {
  if (!validate()) return
  if (!props.expenseId) return

  loading.value = true
  try {
    const result = await $fetch(`/api/expenses/${props.expenseId}`, {
      method: 'PUT',
      body: { ...form.value },
      credentials: 'include',
    })
    emit('expense-updated', result)
    close()
  } catch (e: any) {
    errors.value.form = e.message || 'Не удалось обновить расход. Попробуйте снова.'
  } finally {
    loading.value = false
  }
}

function close() {
  resetForm()
  emit('close')
}

function resetForm() {
  form.value = {
    amount: null, contractorType: '', contractorId: '',
    objectId: '', comment: '', expenseType: '',
    operationDate: new Date().toISOString().split('T')[0],
  }
  selectedType.value = ''
  localDisplay.value = ''
  errors.value = {}
}

watch(() => props.isOpen, async (val) => {
  if (val) {
    await loadData()
    await loadExpenseData()
  }
})
</script>

<style lang="scss" scoped>
.op-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// ── Типы расходов ────────────────────────────────────────────────────
.type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 6px;
}

.type-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 10px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);
  }
}

// ── Поле ────────────────────────────────────────────────────────────
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;

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
    padding: 8px 12px;
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
      min-height: 64px;
    }

    option {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }

    color-scheme: dark;
  }

  &__error {
    font-size: var(--crm-text-xs);
    color: var(--crm-danger);
  }
}

// ── Ошибка формы ─────────────────────────────────────────────────────
.form-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  border-radius: var(--crm-radius-md);
  color: var(--crm-danger);
  font-size: var(--crm-text-sm);
}

// ── Кнопки ──────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);

  &:disabled {
    opacity: .5;
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

  &--primary {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: var(--crm-accent);
      color: white;
    }
  }
}

.spin {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
