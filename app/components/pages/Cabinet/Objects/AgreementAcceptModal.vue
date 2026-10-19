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
          {{ modalTitle }}
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

          <!-- Прайс-карточка: показываем цену вместо остатка -->
          <template v-if="mode === 'propose'">
            <div class="accept-info__row">
              <span>Цена за единицу</span>
              <strong>
                {{ formatCurrency(Number(agreement.unitPrice || 0)) }}/{{ unitLabel }}
              </strong>
            </div>
            <div class="accept-info__row">
              <span>Объём</span>
              <strong>указываете вы (после работ)</strong>
            </div>
          </template>

          <!-- Заявка на объём: показываем предложенные исполнителем цифры -->
          <template v-else-if="isProposalMode">
            <div class="accept-info__row">
              <span>Предложено исполнителем</span>
              <strong>
                {{ agreement.volume }} {{ unitLabel }}
                · {{ formatCurrency(agreement.agreedAmount) }}
              </strong>
            </div>
            <div v-if="agreement.publicComment" class="accept-info__row">
              <span>Комментарий исполнителя</span>
              <strong>{{ agreement.publicComment }}</strong>
            </div>
          </template>

          <template v-else>
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
          </template>
        </div>

        <!-- Отклонение: только причина -->
        <div v-if="mode === 'reject-proposal'" class="form-grid">
          <label class="form-field form-field--wide">
            <span>Причина отклонения *</span>
            <textarea
              v-model="form.reason"
              rows="3"
              placeholder="Например: замерено 52 м² вместо 57 м²"
            />
          </label>
        </div>

        <div v-else class="form-grid">
          <label class="form-field">
            <span>{{ volumeLabel }}</span>
            <input
              v-model.number="form.volume"
              type="number"
              min="0"
              step="1"
            />
          </label>

          <label
            v-if="mode === 'accept' || mode === 'submit' || mode === 'confirm-proposal'"
            class="form-field form-field--wide checkbox-field"
          >
            <input
              v-model="form.manualAmount"
              type="checkbox"
            />
            <span>Указать сумму вручную</span>
          </label>

          <label
            v-if="form.manualAmount && (mode === 'accept' || mode === 'submit' || mode === 'confirm-proposal')"
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
            <span>{{ mode === 'propose' ? 'Расчётная сумма' : 'Сумма приёмки' }}</span>
            <strong>{{ formatCurrency(previewAmount) }}</strong>
          </div>

          <template v-if="mode === 'accept' && (!agreement.contractorType || !agreement.contractorId)">
            <label class="form-field">
              <span>Тип исполнителя</span>
              <select
                v-model="form.contractorType"
                @change="() => (form.contractorId = null)"
              >
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
            <span>{{ commentLabel }}</span>
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
          :class="[
            'crm-btn',
            'crm-btn--sm',
            mode === 'reject-proposal' ? 'crm-btn--danger' : 'crm-btn--primary'
          ]"
          :disabled="saving"
          @click="submit"
        >
          {{ submitButtonLabel }}
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
  mode?: 'accept' | 'submit' | 'propose' | 'confirm-proposal' | 'reject-proposal'
  fixedContractor?: { contractorType: 'master' | 'worker', contractorId: number }
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

// Режимы работы с заявкой на объём (дубль прайс-карточки)
const isProposalMode = computed(
  () => props.mode === 'confirm-proposal' || props.mode === 'reject-proposal'
)

// Режим предложения объёма исполнителем (по прайс-карточке) — см. modalTitle
const modalTitle = computed(() => {
  switch (props.mode) {
    case 'submit':
      return 'Сдача объёма'
    case 'propose':
      return 'Предложить объём'
    case 'confirm-proposal':
      return 'Подтвердить объём'
    case 'reject-proposal':
      return 'Отклонить заявку'
    default:
      return 'Приёмка объёма'
  }
})

const volumeLabel = computed(() => {
  switch (props.mode) {
    case 'propose':
      return `Объём (ваш расчёт), ${unitLabel.value}`
    case 'confirm-proposal':
      return `Объём к подтверждению, ${unitLabel.value}`
    default:
      return 'Объём к приёмке'
  }
})

const commentLabel = computed(() => {
  switch (props.mode) {
    case 'propose':
      return 'Комментарий к заявке'
    case 'confirm-proposal':
      return 'Комментарий к подтверждению'
    case 'reject-proposal':
      return ''
    case 'submit':
      return 'Комментарий к сдаче'
    default:
      return 'Комментарий к приёмке'
  }
})

const submitButtonLabel = computed(() => {
  if (saving.value) {
    switch (props.mode) {
      case 'submit':
        return 'Сдача...'
      case 'propose':
        return 'Отправка...'
      case 'confirm-proposal':
        return 'Подтверждение...'
      case 'reject-proposal':
        return 'Отклонение...'
      default:
        return 'Принятие...'
    }
  }

  switch (props.mode) {
    case 'submit':
      return 'Сдать'
    case 'propose':
      return 'Отправить на проверку'
    case 'confirm-proposal':
      return 'Подтвердить'
    case 'reject-proposal':
      return 'Отклонить'
    default:
      return 'Принять'
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
  comment: '',
  // Причина отклонения заявки (режим reject-proposal)
  reason: ''
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

  form.manualAmount = false
  form.amount = null
  form.comment = ''
  form.reason = ''

  // Объём по умолчанию зависит от режима:
  //  - сдача/приёмка — весь остаток;
  //  - предложение — пусто (рабочий вводит свой расчёт);
  //  - подтверждение — предложенный исполнителем (можно скорректировать).
  if (props.mode === 'propose') {
    form.volume = 0
  } else if (props.mode === 'confirm-proposal') {
    form.volume = Number(props.agreement.volume || 0)
  } else {
    form.volume = Number(props.agreement.remainingVolume || 0)
  }

  if (props.mode === 'submit' && props.fixedContractor) {
    form.contractorType = props.fixedContractor.contractorType
    form.contractorId = props.fixedContractor.contractorId
  } else if (props.agreement.contractorType && props.agreement.contractorId) {
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

  // Отклонение заявки: обязательна только причина
  if (props.mode === 'reject-proposal') {
    if (!form.reason.trim()) {
      errorMessage.value = 'Укажите причину отклонения'
      return false
    }

    errorMessage.value = ''
    return true
  }

  if (!form.volume || form.volume <= 0) {
    errorMessage.value =
      props.mode === 'propose'
        ? 'Укажите насчитанный объём'
        : 'Укажите объём приёмки'
    return false
  }

  // Ограничение остатком — только для обычной сдачи/приёмки
  // (в подтверждении заявки объём можно скорректировать в обе стороны,
  //  сумма пересчитается на сервере)
  if (
    (props.mode === 'accept' || props.mode === 'submit') &&
    form.volume > Number(props.agreement.remainingVolume || 0)
  ) {
    errorMessage.value = 'Нельзя принять больше оставшегося объёма'
    return false
  }

  if (form.manualAmount && form.amount == null) {
    errorMessage.value = 'Укажите сумму приёмки'
    return false
  }

  if (props.mode === 'accept' && (!form.contractorType || !form.contractorId)) {
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
    const comment = form.comment.trim() || undefined

    let url = `/api/works/agreements/${props.agreement.id}/accept`
    let payload: any = {}

    switch (props.mode) {
      case 'propose':
        // Исполнитель предлагает объём по прайс-карточке
        url = `/api/contractors/me/agreements/${props.agreement.id}/propose-volume`
        payload = {
          volume: Number(form.volume || 0),
          comment
        }
        break

      case 'reject-proposal':
        url = `/api/works/agreements/${props.agreement.id}/reject-proposal`
        payload = {
          reason: form.reason.trim()
        }
        break

      case 'confirm-proposal':
        // Подтверждение заявки: объём можно скорректировать, сумма — по желанию
        url = `/api/works/agreements/${props.agreement.id}/confirm-proposal`
        payload = {
          volume: Number(form.volume || 0),
          comment
        }

        if (form.manualAmount && form.amount != null) {
          payload.amount = Number(form.amount || 0)
        }
        break

      case 'submit':
        url = `/api/contractors/me/agreements/${props.agreement.id}/submit`
        payload = {
          volume: Number(form.volume || 0),
          comment
        }

        if (form.manualAmount && form.amount != null) {
          payload.amount = Number(form.amount || 0)
        }
        break

      default:
        // Обычная приёмка админом
        payload = {
          volume: Number(form.volume || 0),
          contractorType: form.contractorType,
          contractorId: form.contractorId,
          comment
        }

        if (form.manualAmount && form.amount != null) {
          payload.amount = Number(form.amount || 0)
        }
    }

    await api.post(url, payload)

    emit('saved')
    close()
  } catch (error: any) {
    console.error('[Договорённости] Ошибка отправки:', error)

    // Показываем сообщение сервера, если есть
    const serverMessage =
      error?.data?.data?.message ||
      error?.data?.message ||
      error?.statusMessage

    errorMessage.value = serverMessage || 'Не удалось сохранить данные'
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

    // Списки исполнителей нужны только для приёмки без назначенного исполнителя
    if (props.mode === 'accept') {
      loadContractors()
    }
  }
})

onMounted(() => {
  if (show.value) {
    resetForm()

    if (props.mode === 'accept') {
      loadContractors()
    }
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
    color: var(--crm-text-primary);
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
  color: var(--crm-success);

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

// ── Кнопки ────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;
  border: 1px solid transparent;

  padding: 8px 14px;
  font-size: var(--crm-text-sm);

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }

  &--primary {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, .35);
    color: var(--crm-success);

    &:hover:not(:disabled) {
      background: rgba(61, 214, 140, .25);
    }
  }

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }

  &--danger {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, 0.4);
    color: var(--crm-danger);

    &:hover:not(:disabled) {
      background: rgba(242, 95, 92, 0.25);
      color: var(--crm-danger);
    }
  }
}
</style>