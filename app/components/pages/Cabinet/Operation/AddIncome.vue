<!-- app/components/pages/cabinet/Operation/AddIncome.vue -->
<template>
  <PagesCabinetUiModal :visible="isOpen" title="Добавить приход" size="md" closable @close="close">
    <div class="op-form">

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

      <!-- Объект -->
      <div class="field">
        <label class="field__label">Объект <span class="field__req">*</span></label>
        <select class="field__input" :class="{ 'field__input--error': errors.objectId }" v-model="form.objectId">
          <option value="">— Выберите объект —</option>
          <option v-for="o in objects" :key="o.id" :value="o.id">{{ o.name }}</option>
        </select>
        <span v-if="errors.objectId" class="field__error">{{ errors.objectId }}</span>
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
      <button class="crm-btn crm-btn--success" @click="submitIncome" :disabled="loading">
        <Icon v-if="loading" name="mdi:loading" class="spin" size="14" />
        {{ loading ? 'Сохранение...' : 'Добавить приход' }}
      </button>
    </template>
  </PagesCabinetUiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps < { isOpen: boolean } > ()
const emit = defineEmits < { close: []; 'income-added': [result: any] } > ()

// ── Состояние ───────────────────────────────────────────────────────
const loading = ref(false)
const errors = ref < Record < string, string>> ({})
const objects = ref < any[] > ([])
const localDisplay = ref('')

const form = ref({
  amount: null as number | null,
  objectId: '',
  comment: '',
  operationDate: new Date().toISOString().split('T')[0],
})

// ── Форматирование суммы ─────────────────────────────────────────────
const displayAmount = computed({
  get() {
    if (form.value.amount === null) return ''
    return new Intl.NumberFormat('ru-RU').format(form.value.amount)
  },
  set(value: string) { localDisplay.value = value }
})

function parseNumber(str: string) {
  if (!str) return NaN
  return parseFloat(str.replace(/[^\d,.-]/g, '').replace(',', '.'))
}

function unformatOnFocus() {
  localDisplay.value = form.value.amount !== null ? String(form.value.amount) : ''
}

function formatOnBlur() {
  const num = parseNumber(localDisplay.value)
  if (!isNaN(num) && num >= 0) form.value.amount = num
}

function syncAmount() {
  const num = parseNumber(localDisplay.value)
  if (!isNaN(num)) form.value.amount = num
  else if (!localDisplay.value) form.value.amount = null
}

// ── Загрузка ────────────────────────────────────────────────────────
async function loadData() {
  try {
    objects.value = await $fetch < any[] > ('/api/objects') || []
  } catch (e) {
    console.error('[ДобавитьПриход] Ошибка загрузки объектов:', e)
  }
}

// ── Валидация ────────────────────────────────────────────────────────
function validate() {
  errors.value = {}
  if (!form.value.amount || form.value.amount <= 0) {
    errors.value.amount = 'Сумма обязательна и должна быть больше нуля'
  }
  if (!form.value.objectId) {
    errors.value.objectId = 'Выберите объект'
  }
  if (!form.value.operationDate) {
    errors.value.operationDate = 'Дата операции обязательна'
  }
  return Object.keys(errors.value).length === 0
}

// ── Отправка ─────────────────────────────────────────────────────────
async function submitIncome() {
  if (!validate()) return
  loading.value = true
  try {
    const result = await $fetch('/api/comings', {
      method: 'POST',
      body: { ...form.value },
      credentials: 'include',
    })
    emit('income-added', result)
    close()
  } catch {
    errors.value.form = 'Не удалось добавить приход. Попробуйте снова.'
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
    amount: null, objectId: '', comment: '',
    operationDate: new Date().toISOString().split('T')[0],
  }
  localDisplay.value = ''
  errors.value = {}
}

watch(() => props.isOpen, val => { if (val) loadData() })
</script>

<style lang="scss" scoped>
.op-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

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

  &--success {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, 0.35);
    color: var(--crm-success);

    &:hover:not(:disabled) {
      background: rgba(61, 214, 140, 0.25);
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