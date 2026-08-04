<!-- app/components/Pages/Cabinet/Objects/AgreementAcceptModal.vue -->
<template>
  <div
    v-if="show && agreement"
    class="modal-overlay"
    @click.self="close"
  >
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">
          Приёмка объёма
        </h3>

        <button class="modal__close" @click="close">
          ✕
        </button>
      </div>

      <div class="modal__body">
        <div v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </div>

        <div class="accept-info">
          <div class="accept-info__row">
            <span>Договорённость</span>
            <strong>{{ agreement.title }}</strong>
          </div>

          <div class="accept-info__row">
            <span>Осталось объём</span>
            <strong>
              {{ agreement.remainingVolume }} {{ unitLabel }}
            </strong>
          </div>

          <div class="accept-info__row">
            <span>Осталось сумма</span>
            <strong>{{ formatCurrency(agreement.remainingAmount) }}</strong>
          </div>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>Объём к приёмке</span>
            <input
              v-model.number="form.volume"
              type="number"
              min="0"
              step="0.001"
            />
          </label>

          <label class="form-field form-field--wide checkbox-field">
            <input
              v-model="form.manualAmount"
              type="checkbox"
            />
            <span>Указать сумму вручную</span>
          </label>

          <label
            v-if="form.manualAmount"
            class="form-field"
          >
            <span>Сумма приёмки, ₽</span>
            <input
              v-model.number="form.amount"
              type="number"
              min="0"
              step="0.01"
            />
          </label>

          <div
            v-else
            class="form-field"
          >
            <span>Сумма приёмки</span>
            <strong>{{ formatCurrency(previewAmount) }}</strong>
          </div>

          <template v-if="!agreement.contractorType || !agreement.contractorId">
            <label class="form-field">
              <span>Тип исполнителя</span>
              <select v-model="form.contractorType">
                <option :value="null">
                  Выберите тип
                </option>
                <option value="master">
                  Мастер
                </option>
                <option value="worker">
                  Рабочий
                </option>
              </select>
            </label>

            <label
              v-if="form.contractorType === 'master'"
              class="form-field"
            >
              <span>Мастер</span>
              <select v-model="form.contractorId">
                <option :value="null">
                  Выберите мастера
                </option>
                <option
                  v-for="master in masters"
                  :key="master.id"
                  :value="master.id"
                >
                  {{ master.name }}
                </option>
              </select>
            </label>

            <label
              v-if="form.contractorType === 'worker'"
              class="form-field"
            >
              <span>Рабочий</span>
              <select v-model="form.contractorId">
                <option :value="null">
                  Выберите рабочего
                </option>
                <option
                  v-for="worker in workers"
                  :key="worker.id"
                  :value="worker.id"
                >
                  {{ worker.name }}
                </option>
              </select>
            </label>
          </template>

          <label class="form-field form-field--wide">
            <span>Комментарий к приёмке</span>
            <textarea
              v-model="form.comment"
              rows="3"
            />
          </label>
        </div>
      </div>

      <div class="modal__footer">
        <button
          class="crm-btn crm-btn--ghost crm-btn--sm"
          @click="close"
        >
          Отмена
        </button>

        <button
          class="crm-btn crm-btn--primary crm-btn--sm"
          :disabled="saving"
          @click="submit"
        >
          {{ saving ? 'Принятие...' : 'Принять' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

const props = defineProps<{
  modelValue: boolean
  agreement?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const api = useApi()

const show = computed({
  get() {
    return props.modelValue
  },
  set(value: boolean) {
    emit('update:modelValue', value)
  }
})

const masters = ref<any[]>([])
const workers = ref<any[]>([])

const saving = ref(false)
const errorMessage = ref('')

const form = reactive({
  volume: 0,
  manualAmount: false,
  amount: null as number | null,
  contractorType: null as 'master' | 'worker' | null,
  contractorId: null as number | null,
  comment: ''
})

const unitLabel = computed(() => {
  if (!props.agreement) {
    return ''
  }

  if (props.agreement.unit === 'custom') {
    return props.agreement.unitCustom || 'ед.'
  }

  const labels: Record<string, string> = {
    m2: 'м²',
    m3: 'м³',
    m: 'м',
    pcs: 'шт',
    hour: 'ч',
    shift: 'смена',
    service: 'услуга'
  }

  return labels[props.agreement.unit] || props.agreement.unit
})

const previewAmount = computed(() => {
  if (!props.agreement) {
    return 0
  }

  if (form.manualAmount && form.amount != null) {
    return Number(form.amount || 0)
  }

  const volume = Number(form.volume || 0)

  if (props.agreement.priceMode === 'unit') {
    return volume * Number(props.agreement.unitPrice || 0)
  }

  const totalVolume = Number(props.agreement.volume || 0)
  const totalAmount = Number(props.agreement.agreedAmount || 0)

  if (!totalVolume) {
    return 0
  }

  return (volume / totalVolume) * totalAmount
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value || 0) + ' ₽'
}

function resetForm() {
  errorMessage.value = ''

  if (!props.agreement) {
    return
  }

  form.volume = Number(props.agreement.remainingVolume || 0)
  form.manualAmount = false
  form.amount = null
  form.comment = ''

  if (props.agreement.contractorType && props.agreement.contractorId) {
    form.contractorType = props.agreement.contractorType
    form.contractorId = props.agreement.contractorId
  } else {
    form.contractorType = null
    form.contractorId = null
  }
}

async function loadContractors() {
  try {
    const [mastersResponse, workersResponse] = await Promise.all([
      api.get<any>('/api/contractors/master'),
      api.get<any>('/api/contractors/worker')
    ])

    // API возвращает { contractors: [] }, обрабатываем оба варианта
    const mastersList = mastersResponse?.contractors || mastersResponse || []
    const workersList = workersResponse?.contractors || workersResponse || []

    masters.value = Array.isArray(mastersList) ? mastersList : []
    workers.value = Array.isArray(workersList) ? workersList : []
  } catch (error) {
    console.error('[Договорённости] Ошибка загрузки исполнителей:', error)
  }
}

function validate() {
  if (!props.agreement) {
    errorMessage.value = 'Договорённость не выбрана'
    return false
  }

  if (!form.volume || form.volume <= 0) {
    errorMessage.value = 'Укажите объём приёмки'
    return false
  }

  if (form.volume > Number(props.agreement.remainingVolume || 0)) {
    errorMessage.value = 'Нельзя принять больше оставшегося объёма'
    return false
  }

  if (form.manualAmount && form.amount == null) {
    errorMessage.value = 'Укажите сумму приёмки'
    return false
  }

  if (!form.contractorType || !form.contractorId) {
    errorMessage.value = 'Выберите исполнителя'
    return false
  }

  errorMessage.value = ''
  return true
}

async function submit() {
  if (!props.agreement) {
    return
  }

  if (!validate()) {
    return
  }

  saving.value = true

  try {
    const payload: any = {
      volume: Number(form.volume || 0),
      contractorType: form.contractorType,
      contractorId: form.contractorId,
      comment: form.comment.trim() || undefined
    }

    if (form.manualAmount && form.amount != null) {
      payload.amount = Number(form.amount || 0)
    }

    await api.post(
      `/api/works/agreements/${props.agreement.id}/accept`,
      payload
    )

    emit('saved')
    close()
  } catch (error) {
    console.error('[Договорённости] Ошибка приёмки:', error)
    errorMessage.value = 'Не удалось принять объём'
  } finally {
    saving.value = false
  }
}

function close() {
  show.value = false
}

watch(() => props.modelValue, (value) => {
  if (value) {
    resetForm()
    loadContractors()
  }
})

watch(() => form.contractorType, () => {
  form.contractorId = null
})

onMounted(() => {
  if (show.value) {
    resetForm()
    loadContractors()
  }
})
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
}

.modal {
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow: auto;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid var(--crm-border);
  }

  &__title {
    margin: 0;
    font-size: var(--crm-text-md);
    font-weight: 600;
  }

  &__close {
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--crm-text-muted);
  }

  &__body {
    padding: 16px;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 16px;
    border-top: 1px solid var(--crm-border);
  }
}

.accept-info {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  background: var(--crm-bg-elevated);
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: var(--crm-text-sm);

    span {
      color: var(--crm-text-muted);
    }

    strong {
      color: var(--crm-text-primary);
    }
  }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &--wide {
    grid-column: 1 / -1;
  }

  span {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    background: var(--crm-bg-elevated);
    color: var(--crm-text-primary);
    outline: none;

    &:focus {
      border-color: var(--crm-accent);
    }
  }
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 8px;

  input {
    width: auto;
  }

  span {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-primary);
  }
}

.form-error {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: var(--crm-radius-md);
  background: var(--crm-danger-dim);
  border: 1px solid rgba(242, 95, 92, 0.3);
  color: var(--crm-danger);
  font-size: var(--crm-text-sm);
}
</style>