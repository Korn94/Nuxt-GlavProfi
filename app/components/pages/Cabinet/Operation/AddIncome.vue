<!-- app\components\pages\cabinet\Operation\AddIncome.vue -->
<template>
  <PagesCabinetUiModal
    :visible="isOpen"
    @close="close"
    title="Добавить приход"
    size="md"
    closable
  >
    <!-- Слот контента -->
    <div class="modal-content">
      <form @submit.prevent="submitIncome">
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

        <!-- Объект -->
        <div class="form-group">
          <label>Объект <span class="required">*</span></label>
          <select v-model="form.objectId" required>
            <option value="">Выберите объект</option>
            <option v-for="object in objects" :key="object.id" :value="object.id">
              {{ object.name }}
            </option>
          </select>
          <span v-if="errors.objectId" class="error-message">{{ errors.objectId }}</span>
        </div>

        <!-- Комментарий -->
        <div class="form-group">
          <label>Комментарий</label>
          <textarea v-model="form.comment" placeholder="Дополнительная информация"></textarea>
        </div>

        <!-- Ошибки формы -->
        <div v-if="errors.form" class="error-message form-error">
          {{ errors.form }}
        </div>
      </form>
    </div>

    <!-- Футер -->
    <template #footer>
      <button type="button" @click="close" class="btn btn-secondary">Отмена</button>
      <button type="submit" @click="submitIncome" class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Сохранение...' : 'Добавить приход' }}
      </button>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'income-added'])

// Форма
const form = ref({
  amount: null,
  objectId: '',
  comment: '',
  operationDate: new Date().toISOString().split('T')[0],
})

const loading = ref(false)
const errors = ref({})
const objects = ref([])

// Вычисляемое поле для отображения суммы с пробелами
const displayAmount = computed({
  get() {
    if (form.value.amount === null || form.value.amount === '') return ''
    // Форматируем число с пробелами как разделитель
    return new Intl.NumberFormat('ru-RU').format(form.value.amount)
  },
  set(value) {
    // Сохраняем строковое значение в input
    localDisplayValue.value = value
  }
})

// Локальное состояние для хранения строки во время ввода
const localDisplayValue = ref('')

// При фокусе — показываем "чистую" строку (без форматирования)
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

// При каждом вводе обновляем локальную строку и синхронизируем число
function syncAmount() {
  const raw = localDisplayValue.value
  const num = parseNumber(raw)
  if (!isNaN(num)) {
    form.value.amount = num
  } else if (raw === '' || raw === null) {
    form.value.amount = null
  }
  // Не обновляем form.value.amount, если некорректно — оставим предыдущее
}

// Помощник: парсит строку в число, игнорируя все кроме цифр и десятичного разделителя
function parseNumber(str) {
  if (!str) return NaN
  // Удаляем всё, кроме цифр и запятой/точки
  const cleaned = str.replace(/[^\d,.-]/g, '').replace(',', '.')
  return parseFloat(cleaned)
}

// Загрузка данных
async function loadData() {
  try {
    objects.value = await $fetch('/api/objects')
  } catch (error) {
    console.error('Ошибка загрузки объектов:', error)
  }
}

// Валидация
function validateForm() {
  errors.value = {}
  let isValid = true

  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Сумма обязательна и должна быть больше нуля'
    isValid = false
  }

  if (!form.value.objectId) {
    errors.value.objectId = 'Объект обязателен'
    isValid = false
  }

  if (!form.value.operationDate) {
    errors.value.operationDate = 'Дата операции обязательна'
    isValid = false
  }

  return isValid
}

// Отправка
async function submitIncome() {
  if (!validateForm()) return

  loading.value = true
  try {
    const payload = {
      ...form.value,
      operationDate: form.value.operationDate,
    }

    const result = await $fetch('/api/comings', {
      method: 'POST',
      body: payload,
      credentials: 'include',
    })

    emit('income-added', result)
    close()
  } catch (error) {
    errors.value.form = 'Не удалось добавить приход'
  } finally {
    loading.value = false
  }
}

// Закрытие и сброс
function close() {
  resetForm()
  emit('close')
}

function resetForm() {
  form.value = {
    amount: null,
    objectId: '',
    comment: '',
    operationDate: new Date().toISOString().split('T')[0],
  }
  localDisplayValue.value = ''
  errors.value = {}
}

// Загрузка при открытии
watch(() => props.isOpen, async (val) => {
  if (val) await loadData()
})
</script>

<style lang="scss" scoped>
.modal-content {
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
    &:hover { background: $blue }
  }

  &-primary {
    background: $green;
    color: $text-light;
    &:not(:disabled):hover { background: $blue; }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}
</style>