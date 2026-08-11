<!-- app/components/Pages/Cabinet/Objects/AgreementFormModal.vue -->
<template>
  <div
    v-if="show"
    class="modal-overlay"
    @click.self="close"
  >
    <div class="modal">
      <div class="modal__header">
        <h3 class="modal__title">
          {{ agreement ? 'Редактировать договорённость' : 'Новая договорённость' }}
        </h3>

        <button class="modal__close" @click="close">
          ✕
        </button>
      </div>

      <div class="modal__body">
        <div v-if="errorMessage" class="form-error">
          {{ errorMessage }}
        </div>

        <div class="form-grid">
          <label class="form-field form-field--wide">
            <span>Название</span>
            <input
              v-model="form.title"
              type="text"
              placeholder="Например: Плитка"
            />
          </label>

          <label class="form-field">
            <span>Тип работы</span>
            <select v-model="form.workType">
              <option
                v-for="workType in workTypes"
                :key="workType"
                :value="workType"
              >
                {{ workType }}
              </option>
            </select>
          </label>

          <label class="form-field">
            <span>Объём</span>
            <input
              v-model.number="form.volume"
              type="number"
              min="0"
              step="1"
              :disabled="isLocked"
            />
          </label>

          <label class="form-field">
            <span>Единица измерения</span>
            <select
              v-model="form.unit"
              :disabled="isLocked"
            >
              <option
                v-for="unit in units"
                :key="unit.value"
                :value="unit.value"
              >
                {{ unit.label }}
              </option>
            </select>
          </label>

          <label
            v-if="form.unit === 'custom'"
            class="form-field"
          >
            <span>Своя единица</span>
            <input
              v-model="form.unitCustom"
              type="text"
              placeholder="Например: комплект"
              :disabled="isLocked"
            />
          </label>

          <label class="form-field">
            <span>Тип цены</span>
            <select
              v-model="form.priceMode"
              :disabled="isLocked"
            >
              <option value="unit">
                Цена за единицу
              </option>
              <option value="fixed">
                Итоговая сумма
              </option>
            </select>
          </label>

          <label
            v-if="form.priceMode === 'unit'"
            class="form-field"
          >
            <span>Цена за единицу, ₽</span>
            <input
              v-model.number="form.unitPrice"
              type="number"
              min="0"
              step="0.01"
              :disabled="isLocked"
            />
          </label>

          <label
            v-if="form.priceMode === 'fixed'"
            class="form-field"
          >
            <span>Итоговая сумма, ₽</span>
            <input
              v-model.number="form.fixedTotal"
              type="number"
              min="0"
              step="0.01"
              :disabled="isLocked"
            />
          </label>

          <div class="form-field form-field--wide">
            <span>Сумма договорённости</span>
            <strong>{{ formatCurrency(totalAmount) }}</strong>
          </div>

          <label class="form-field">
            <span>Тип исполнителя</span>
            <select
              v-model="form.contractorType"
              @change="() => (form.contractorId = null)"
            >
              <option :value="null">
                Не назначен
              </option>
              <option value="worker">
                Рабочий
              </option>
              <option value="master">
                Мастер
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

          <label class="form-field form-field--wide">
            <span>Комментарий для рабочих и админов</span>
            <textarea
              v-model="form.publicComment"
              rows="3"
            />
          </label>

          <label
            v-if="isAdmin"
            class="form-field form-field--wide"
          >
            <span>Комментарий только для админов</span>
            <textarea
              v-model="form.adminComment"
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
          {{ saving ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { usePermissions } from '~/composables/usePermissions'

const props = defineProps<{
  modelValue: boolean
  objectId: number
  agreement?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const api = useApi()
const { hasRole } = usePermissions()

const isAdmin = computed(() => hasRole('admin'))

const show = computed({
  get() {
    return props.modelValue
  },
  set(value: boolean) {
    emit('update:modelValue', value)
  }
})

const workTypes = [
  'Отделка',
  'Электрика',
  'Плитка',
  'Сантехника',
  'Перегородки ГКЛ',
  'Потолок',
  'Сварка',
  'Бетонные работы',
  'Кровля',
  'Фасад',
  'Перегородки Камень',
  'Демонтаж',
  'Мусор',
  'Разнорабочий',
  'Смежники',
  'Подневка',
  'Прочее'
]

const units = [
  { value: 'm2', label: 'м²' },
  { value: 'm3', label: 'м³' },
  { value: 'm', label: 'м' },
  { value: 'pcs', label: 'шт' },
  { value: 'hour', label: 'час' },
  { value: 'shift', label: 'смена' },
  { value: 'service', label: 'услуга' },
  { value: 'custom', label: 'Другое' }
]

const masters = ref<any[]>([])
const workers = ref<any[]>([])

const saving = ref(false)
const errorMessage = ref('')

const form = reactive({
  title: '',
  workType: 'Прочее',
  volume: null as number | null,
  unit: 'm2',
  unitCustom: '',
  priceMode: 'unit' as 'unit' | 'fixed',
  unitPrice: null as number | null,
  fixedTotal: null as number | null,
  contractorType: null as 'master' | 'worker' | null,
  contractorId: null as number | null,
  publicComment: '',
  adminComment: ''
})

const isLocked = computed(() => {
  return Boolean(
    props.agreement &&
    Number(props.agreement.acceptedVolume || 0) > 0
  )
})

const totalAmount = computed(() => {
  if (form.priceMode === 'fixed') {
    return Number(form.fixedTotal || 0)
  }

  return Number(form.volume || 0) * Number(form.unitPrice || 0)
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value || 0) + ' ₽'
}

function resetForm() {
  errorMessage.value = ''

  if (props.agreement) {
    form.title = props.agreement.title || ''
    form.workType = props.agreement.workType || 'Прочее'
    form.volume = Number(props.agreement.volume || 0)
    form.unit = props.agreement.unit || 'm2'
    form.unitCustom = props.agreement.unitCustom || ''
    form.priceMode = props.agreement.priceMode || 'unit'
    form.unitPrice = props.agreement.unitPrice != null
      ? Number(props.agreement.unitPrice)
      : null
    form.fixedTotal = props.agreement.fixedTotal != null
      ? Number(props.agreement.fixedTotal)
      : null
    form.contractorType = props.agreement.contractorType || null
    form.contractorId = props.agreement.contractorId || null
    form.publicComment = props.agreement.publicComment || ''
    form.adminComment = props.agreement.adminComment || ''
  } else {
    form.title = ''
    form.workType = 'Прочее'
    form.volume = null
    form.unit = 'm2'
    form.unitCustom = ''
    form.priceMode = 'unit'
    form.unitPrice = null
    form.fixedTotal = null
    form.contractorType = null
    form.contractorId = null
    form.publicComment = ''
    form.adminComment = ''
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
  if (!form.title.trim()) {
    errorMessage.value = 'Укажите название'
    return false
  }

  if (!form.volume || form.volume <= 0) {
    errorMessage.value = 'Укажите объём'
    return false
  }

  if (form.unit === 'custom' && !form.unitCustom.trim()) {
    errorMessage.value = 'Укажите свою единицу измерения'
    return false
  }

  if (form.priceMode === 'unit' && form.unitPrice == null) {
    errorMessage.value = 'Укажите цену за единицу'
    return false
  }

  if (form.priceMode === 'fixed' && form.fixedTotal == null) {
    errorMessage.value = 'Укажите итоговую сумму'
    return false
  }

  if (form.contractorType && !form.contractorId) {
    errorMessage.value = 'Выберите исполнителя'
    return false
  }

  errorMessage.value = ''
  return true
}

async function submit() {
  if (!validate()) {
    return
  }

  saving.value = true

  try {
    const payload: any = {
      objectId: props.objectId,
      title: form.title.trim(),
      workType: form.workType,
      volume: Number(form.volume || 0),
      unit: form.unit,
      unitCustom: form.unit === 'custom' ? form.unitCustom.trim() : null,
      priceMode: form.priceMode,
      unitPrice: form.priceMode === 'unit' ? Number(form.unitPrice || 0) : null,
      fixedTotal: form.priceMode === 'fixed' ? Number(form.fixedTotal || 0) : null,
      contractorType: form.contractorType || null,
      contractorId: form.contractorId || null,
      publicComment: form.publicComment.trim() || null
    }

    if (isAdmin.value) {
      payload.adminComment = form.adminComment.trim() || null
    }

    if (props.agreement) {
      await api.patch(`/api/works/agreements/${props.agreement.id}`, payload)
    } else {
      await api.post('/api/works/agreements', payload)
    }

    emit('saved')
    close()
  } catch (error) {
    console.error('[Договорённости] Ошибка сохранения:', error)
    errorMessage.value = 'Не удалось сохранить договорённость'
  } finally {
    saving.value = false
  }
}

function close() {
  show.value = false
}

watch(
  () => props.modelValue,
  (value) => {
    if (value) {
      resetForm()
      loadContractors()
    }
  }
)

watch(() => form.unit, (newVal) => {
  if (newVal !== 'custom') {
    form.unitCustom = ''
  }
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
  max-width: 760px;
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
    font-size: 18px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--crm-radius-md);
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
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

  strong {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-text-primary);
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
    transition: var(--crm-transition);

    &:focus {
      border-color: var(--crm-accent);
    }

    &:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
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
    border: 1px solid rgba(242, 95, 92, 0.3);
    color: var(--crm-danger);

    &:hover:not(:disabled) {
      background: var(--crm-danger);
      color: white;
    }
  }
}
</style>