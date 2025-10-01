<!-- app\components\pages\cabinet\Operation\AddExpense.vue -->
<template>
  <PagesCabinetUiModal
    :visible="isOpen"
    @close="close"
    title="Добавить расход"
    size="md"
    closable
  >
    <!-- Контент -->
    <div class="modal-content">
      <!-- Тип расхода -->
      <div class="form-group expense-types">
        <label>Тип расхода:</label>
        <div class="type-buttons">
          <button
            v-for="type in expenseTypes"
            :key="type"
            :class="['type-btn', { active: selectedType === type }]"
            @click="selectType(type)"
          >
            {{ type }}
          </button>
        </div>
      </div>

      <!-- Форма -->
      <form @submit.prevent="submitExpense">
        <!-- Сумма -->
        <div class="form-group">
          <label>Сумма <span class="required">*</span></label>
          <input
            type="text"
            v-model="displayAmount"
            placeholder="Введите сумму"
            @blur="formatOnBlur"
            @focus="unformatOnFocus"
            @input="syncAmount"
            required
          />
          <span v-if="errors.amount" class="error-message">{{ errors.amount }}</span>
        </div>

        <!-- Дата операции -->
        <div class="form-group">
          <label>Дата операции <span class="required">*</span></label>
          <input type="date" v-model="form.operationDate" required />
          <span v-if="errors.operationDate" class="error-message">{{ errors.operationDate }}</span>
        </div>

        <!-- Поля по типу -->
        <div v-if="selectedType === 'Работа'" class="nested-form">
          <div class="form-group">
            <label>Категория контрагента <span class="required">*</span></label>
            <select v-model="form.contractorType" required>
              <option value="">Выберите категорию</option>
              <option value="worker">Разнорабочий</option>
              <option value="master">Мастер</option>
              <option value="foreman">Прораб</option>
              <option value="office">Офис</option>
            </select>
            <span v-if="errors.contractorType" class="error-message">{{ errors.contractorType }}</span>
          </div>

          <div class="form-group">
            <label>Контрагент <span class="required">*</span></label>
            <select v-model="form.contractorId" required>
              <option value="">Выберите контрагента</option>
              <option v-for="c in contractorsByType" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
            <span v-if="errors.contractorId" class="error-message">{{ errors.contractorId }}</span>
          </div>

          <div class="form-group">
            <label>Объект</label>
            <select v-model="form.objectId">
              <option value="">Без объекта</option>
              <option v-for="o in objects" :key="o.id" :value="o.id">
                {{ o.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="selectedType === 'Налог'" class="nested-form">
          <div class="form-group">
            <label>Объект</label>
            <select v-model="form.objectId">
              <option value="">Без объекта</option>
              <option v-for="o in objects" :key="o.id" :value="o.id">
                {{ o.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="['Зарплата', 'Топливо'].includes(selectedType)" class="nested-form">
          <div class="form-group">
            <label>Категория контрагента <span class="required">*</span></label>
            <select v-model="form.contractorType" required>
              <option value="">Выберите категорию</option>
              <option value="worker">Разнорабочий</option>
              <option value="master">Мастер</option>
              <option value="foreman">Прораб</option>
              <option value="office">Офис</option>
            </select>
            <span v-if="errors.contractorType" class="error-message">{{ errors.contractorType }}</span>
          </div>

          <div class="form-group">
            <label>Контрагент <span class="required">*</span></label>
            <select v-model="form.contractorId" required>
              <option value="">Выберите контрагента</option>
              <option v-for="c in contractorsByType" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
            <span v-if="errors.contractorId" class="error-message">{{ errors.contractorId }}</span>
          </div>
        </div>

        <!-- Комментарий -->
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="form.comment" placeholder="Дополнительная информация"></textarea>
        </div>

        <!-- Ошибка формы -->
        <div v-if="errors.form" class="error-message form-error">
          {{ errors.form }}
        </div>
      </form>
    </div>

    <!-- Футер -->
    <template #footer>
      <button type="button" @click="close" class="btn btn-secondary">Отмена</button>
      <button type="submit" @click="submitExpense" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Сохранение...' : 'Добавить расход' }}
      </button>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({ isOpen: Boolean })
const emit = defineEmits(['close', 'expense-added'])

// Форма
const form = ref({
  amount: null,
  contractorType: '',
  contractorId: '',
  objectId: '',
  comment: '',
  expenseType: '',
  operationDate: new Date().toISOString().split('T')[0],
})

const selectedType = ref('')
const loading = ref(false)
const errors = ref({})
const contractors = ref([])
const objects = ref([])

// Локальное состояние для отображаемой строки
const localDisplayValue = ref('')

// Вычисляемое поле для отображения суммы с пробелами
const displayAmount = computed({
  get() {
    if (form.value.amount === null || form.value.amount === '') return ''
    return new Intl.NumberFormat('ru-RU').format(form.value.amount)
  },
  set(value) {
    localDisplayValue.value = value
  }
})

// Парсинг строки в число
function parseNumber(str) {
  if (!str) return NaN
  const cleaned = str.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned)
}

// При фокусе — показываем "сырое" число
function unformatOnFocus() {
  if (form.value.amount !== null) {
    localDisplayValue.value = String(form.value.amount)
  } else {
    localDisplayValue.value = ''
  }
}

// При потере фокуса — форматируем обратно
function formatOnBlur() {
  const num = parseNumber(localDisplayValue.value)
  if (!isNaN(num) && num >= 0) {
    form.value.amount = num
    localDisplayValue.value = new Intl.NumberFormat('ru-RU').format(num)
  } else {
    localDisplayValue.value = form.value.amount
      ? new Intl.NumberFormat('ru-RU').format(form.value.amount)
      : ''
  }
}

// При каждом вводе — обновляем локальную строку и синхронизируем число
function syncAmount() {
  const raw = localDisplayValue.value
  const num = parseNumber(raw)
  if (!isNaN(num)) {
    form.value.amount = num
  } else if (raw === '' || raw === null) {
    form.value.amount = null
  }
}

// Вычисляем контрагентов по типу
const contractorsByType = computed(() => {
  return contractors.value.filter(c => c.type === form.value.contractorType)
})

const expenseTypes = ['Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи']

function selectType(type) {
  selectedType.value = type
  form.value.expenseType = type
  form.value.contractorType = ''
  form.value.contractorId = ''
  form.value.objectId = ''
  form.value.comment = ''
}

async function loadData() {
  try {
    const [workers, masters, foremans, offices] = await Promise.all([
      $fetch('/api/contractors/workers'),
      $fetch('/api/contractors/masters'),
      $fetch('/api/contractors/foremans'),
      $fetch('/api/contractors/offices'),
    ])

    contractors.value = [
      ...workers.map(w => ({ ...w, type: 'worker' })),
      ...masters.map(m => ({ ...m, type: 'master' })),
      ...foremans.map(f => ({ ...f, type: 'foreman' })),
      ...offices.map(o => ({ ...o, type: 'office' })),
    ]

    objects.value = await $fetch('/api/objects')
  } catch (error) {
    console.error('Ошибка загрузки данных:', error)
  }
}

function validateForm() {
  errors.value = {}
  let isValid = true

  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Сумма обязательна и должна быть больше нуля'
    isValid = false
  }

  if (!form.value.operationDate) {
    errors.value.operationDate = 'Дата операции обязательна'
    isValid = false
  }

  const contractorRequired = ['Работа', 'Зарплата', 'Топливо'].includes(selectedType.value)
  if (contractorRequired) {
    if (!form.value.contractorType) {
      errors.value.contractorType = 'Категория контрагента обязательна'
      isValid = false
    }
    if (!form.value.contractorId) {
      errors.value.contractorId = 'Контрагент обязателен'
      isValid = false
    }
  }

  return isValid
}

async function submitExpense() {
  if (!validateForm()) return

  loading.value = true
  try {
    const payload = { ...form.value }
    const result = await $fetch('/api/expenses', {
      method: 'POST',
      body: payload,
      credentials: 'include',
    })

    emit('expense-added', result)
    close()
  } catch (error) {
    errors.value.form = 'Не удалось добавить расход'
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
    amount: null,
    contractorType: '',
    contractorId: '',
    objectId: '',
    comment: '',
    expenseType: '',
    operationDate: new Date().toISOString().split('T')[0],
  }
  selectedType.value = ''
  localDisplayValue.value = ''
  errors.value = {}
}

watch(() => props.isOpen, async (val) => {
  if (val) await loadData()
})
</script>

<style lang="scss" scoped>
@use 'sass:map';

.modal-content {
  .expense-types {
    margin-bottom: 1.5rem;
  }

  .type-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .type-btn {
    padding: 0.5rem 1rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: $background-light;
    cursor: pointer;
    transition: $transition;

    &.active {
      background: $blue;
      color: $text-light;
      border-color: $blue;
    }

    &:hover:not(.active) {
      border-color: $blue;
    }
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: $text-dark;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid $border-color;
    border-radius: $border-radius;
    background: $background-light;
    transition: $transition;

    &:focus {
      outline: none;
      border-color: $blue;
      box-shadow: 0 0 0 2px $blue20;
    }
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  .required {
    color: $red;
  }

  .error-message {
    color: $color-danger;
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }

  .form-error {
    margin-bottom: 1rem;
  }
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
  font-weight: 500;
  transition: $transition;

  &-secondary {
    background: $color-muted;
    color: $text-light;
    &:hover { background: $blue; }
  }

  &-primary {
    background: $red;
    color: $text-light;
    &:not(:disabled):hover { background: $blue; }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>