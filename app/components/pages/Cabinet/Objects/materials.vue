<!-- app/components/pages/cabinet/objects/Materials.vue -->
<template>
  <div class="mat">

    <!-- Сводка -->
    <div class="mat-summary">
      <div class="summary-card summary-card--income">
        <div class="summary-card__icon">
          <Icon name="mdi:arrow-bottom-left" size="16" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__label">Приходы</span>
          <span class="summary-card__value pos">{{ formatAmount(incomingTotal) }} ₽</span>
        </div>
      </div>
      <div class="summary-card summary-card--expense">
        <div class="summary-card__icon">
          <Icon name="mdi:arrow-top-right" size="16" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__label">Расходы</span>
          <span class="summary-card__value neg">{{ formatAmount(outgoingTotal) }} ₽</span>
        </div>
      </div>
      <div class="summary-card summary-card--total">
        <div class="summary-card__icon">
          <Icon name="mdi:scale-balance" size="16" />
        </div>
        <div class="summary-card__info">
          <span class="summary-card__label">Итого</span>
          <span class="summary-card__value" :class="totalBalance >= 0 ? 'pos' : 'neg'">
            {{ formatAmount(totalBalance) }} ₽
          </span>
        </div>
      </div>
    </div>

    <!-- Фильтр + кнопки -->
    <div class="mat-toolbar">
      <div class="mat-filters">
        <select class="filter-select" v-model="filterType" @change="fetchMaterials">
          <option value="">Все типы</option>
          <option value="incoming">Приходы</option>
          <option value="outgoing">Расходы</option>
        </select>

        <input type="date" class="filter-input" v-model="startDate" :max="endDate || ''" @change="fetchMaterials" />
        <span class="filter-sep">—</span>
        <input type="date" class="filter-input" v-model="endDate" :min="startDate || ''" @change="fetchMaterials" />
        <button class="crm-btn crm-btn--ghost crm-btn--xs" @click="clearDateFilter">
          <Icon name="mdi:close" size="13" />
        </button>
      </div>

      <div class="mat-actions">
        <button class="crm-btn crm-btn--income" @click="openModal('incoming')">
          <Icon name="mdi:plus" size="15" /> Приход
        </button>
        <button class="crm-btn crm-btn--expense" @click="openModal('outgoing')">
          <Icon name="mdi:minus" size="15" /> Расход
        </button>
      </div>
    </div>

    <!-- Таблица -->
    <div class="mat-card">

      <div v-if="!filteredMaterials.length" class="mat-empty">
        <Icon name="mdi:receipt-text-outline" size="28" />
        <span>Нет материалов</span>
      </div>

      <div v-else class="mat-table-wrap">
        <table class="mat-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Название</th>
              <th>Сумма</th>
              <th>Тип</th>
              <th>Чек</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(m, idx) in filteredMaterials" :key="m.id"
              :class="['mat-row', `mat-row--${m.type}`, { 'tr--alt': idx % 2 === 1 }]">
              <td class="td--date">{{ formatDate(m.operationDate) }}</td>
              <td class="td--name">{{ m.name }}</td>
              <td class="td--amount" :class="m.type === 'incoming' ? 'pos' : 'neg'">
                {{ m.type === 'incoming' ? '+' : '−' }}{{ formatAmount(m.amount) }} ₽
              </td>
              <td>
                <span :class="['type-badge', `type-badge--${m.type}`]">
                  {{ m.type === 'incoming' ? 'Приход' : 'Расход' }}
                </span>
              </td>
              <td class="td--center">
                <template v-if="m.type === 'outgoing'">
                  <button class="receipt-btn"
                    :class="{ 'receipt-btn--checked': m.hasReceipt, 'receipt-btn--disabled': m.hasReceipt }"
                    :disabled="m.hasReceipt" @click="toggleCheck(m)"
                    :title="m.hasReceipt ? 'Чек есть' : 'Отметить чек'">
                    <Icon :name="m.hasReceipt ? 'mdi:check-circle' : 'mdi:circle-outline'" size="17" />
                  </button>
                </template>
                <span v-else class="td--na">—</span>
              </td>
              <td class="td--actions">
                <button class="action-btn" @click="editMaterial(m)" title="Редактировать">
                  <Icon name="mdi:pencil-outline" size="14" />
                </button>
                <button class="action-btn action-btn--danger" @click="deleteMaterial(m.id)" title="Удалить">
                  <Icon name="mdi:trash-can-outline" size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Модалка -->
    <PagesCabinetUiModal :visible="isModalOpen"
      :title="isEditing ? 'Редактировать материал' : modalType === 'incoming' ? 'Добавить приход' : 'Добавить расход'"
      size="md" closable @update:visible="closeModal">
      <div class="modal-form">

        <div class="field">
          <label class="field__label">Название <span class="field__req">*</span></label>
          <input type="text" class="field__input" :class="{ 'field__input--error': formErrors.name }"
            v-model="currentMaterial.name" placeholder="Название материала" />
          <span v-if="formErrors.name" class="field__error">{{ formErrors.name }}</span>
        </div>

        <div class="field">
          <label class="field__label">Сумма <span class="field__req">*</span></label>
          <input type="number" step="100" class="field__input" :class="{ 'field__input--error': formErrors.amount }"
            v-model.number="currentMaterial.amount" placeholder="0" />
          <span v-if="formErrors.amount" class="field__error">{{ formErrors.amount }}</span>
        </div>

        <div class="field">
          <label class="field__label">Дата операции <span class="field__req">*</span></label>
          <input type="date" class="field__input" :class="{ 'field__input--error': formErrors.operationDate }"
            v-model="currentMaterial.operationDate" />
          <span v-if="formErrors.operationDate" class="field__error">{{ formErrors.operationDate }}</span>
        </div>

        <div class="field">
          <label class="field__label">Комментарий</label>
          <textarea class="field__input field__input--textarea" v-model="currentMaterial.comment"
            placeholder="Дополнительная информация..." rows="2" />
        </div>

        <div v-if="currentMaterial.type === 'outgoing'" class="field field--checkbox">
          <label class="checkbox-label">
            <input type="checkbox" class="checkbox-input" v-model="currentMaterial.hasReceipt" />
            <span class="checkbox-text">Есть чек</span>
          </label>
        </div>

      </div>

      <template #footer>
        <button class="crm-btn crm-btn--ghost" @click="closeModal">Отмена</button>
        <button class="crm-btn crm-btn--accent" :disabled="!isFormValid" @click="saveMaterial">
          {{ isEditing ? 'Сохранить' : 'Добавить' }}
        </button>
      </template>
    </PagesCabinetUiModal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'

const props = defineProps<{
  materials: any[]
  objectId: number
}>()

const emit = defineEmits<{
  add: [m: any]
  update: [m: any]
  delete: [id: number]
}>()

const route = useRoute()
const api = useApi()

// ── Фильтры ──────────────────────────────────────────────────────────
const filterType = ref('')
const startDate = ref('')
const endDate = ref('')

// ── Модалка ──────────────────────────────────────────────────────────
const isModalOpen = ref(false)
const modalType = ref<'incoming' | 'outgoing'>('incoming')
const isEditing = ref(false)
const formErrors = ref<Record<string, string>>({})

const currentMaterial = ref({
  id: null as number | null,
  name: '',
  amount: 0,
  comment: '',
  hasReceipt: false,
  objectId: props.objectId as number,
  type: 'incoming' as 'incoming' | 'outgoing',
  operationDate: new Date().toISOString().split('T')[0],
})

// Локальный список — работаем с ним, не мутируем пропс
const localMaterials = ref<any[]>(props.materials.map(m => ({ ...m, amount: Number(m.amount) })))

watch(() => props.materials, list => {
  localMaterials.value = list.map(m => ({ ...m, amount: Number(m.amount) }))
}, { deep: true })

// ── Computed ─────────────────────────────────────────────────────────
const filteredMaterials = computed(() => {
  let list = [...localMaterials.value]
  if (filterType.value) list = list.filter(m => m.type === filterType.value)
  if (startDate.value) list = list.filter(m => new Date(m.operationDate) >= new Date(startDate.value))
  if (endDate.value) list = list.filter(m => new Date(m.operationDate) <= new Date(endDate.value))
  return list.sort((a, b) => new Date(b.operationDate).getTime() - new Date(a.operationDate).getTime())
})

const incomingTotal = computed(() =>
  localMaterials.value.filter(m => m.type === 'incoming').reduce((s, m) => s + m.amount, 0)
)
const outgoingTotal = computed(() =>
  localMaterials.value.filter(m => m.type === 'outgoing').reduce((s, m) => s + m.amount, 0)
)
const totalBalance = computed(() => incomingTotal.value - outgoingTotal.value)

const isFormValid = computed(() =>
  currentMaterial.value.name.trim() !== '' && Number(currentMaterial.value.amount) > 0
)

// ── Вспомогательные ──────────────────────────────────────────────────
function formatAmount(v: any) {
  return (Number(v) || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0 })
}

function formatDate(s: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit'
  })
}



function clearDateFilter() {
  startDate.value = ''
  endDate.value = ''
  fetchMaterials()
}

// ── Загрузка ─────────────────────────────────────────────────────────
async function fetchMaterials() {
  try {
    const params: Record<string, any> = { objectId: props.objectId }
    if (filterType.value) params.type = filterType.value
    if (startDate.value) params.startDate = startDate.value
    if (endDate.value) params.endDate = endDate.value

    const data = await api.get<any[]>('/api/materials', { params })
    localMaterials.value = (data || []).map(m => ({ ...m, amount: Number(m.amount) }))
  } catch (e) {
    console.error('[Материалы] Ошибка загрузки:', e)
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────
async function saveMaterial() {
  formErrors.value = {}
  if (!currentMaterial.value.name.trim()) formErrors.value.name = 'Название обязательно'
  if (Number(currentMaterial.value.amount) <= 0) formErrors.value.amount = 'Сумма должна быть больше нуля'
  if (!currentMaterial.value.operationDate) formErrors.value.operationDate = 'Дата обязательна'
  if (Object.keys(formErrors.value).length) return

  try {
    if (isEditing.value) {
      const updated = await api.put<any>(`/api/materials/${currentMaterial.value.id}`, currentMaterial.value)
      const idx = localMaterials.value.findIndex(m => m.id === updated.id)
      if (idx !== -1) localMaterials.value.splice(idx, 1, { ...updated, amount: Number(updated.amount) })
      emit('update', updated)
    } else {
      const created = await api.post<any>('/api/materials', currentMaterial.value)
      localMaterials.value.push({ ...created, amount: Number(created.amount) })
      emit('add', created)
    }
    closeModal()
  } catch (e) {
    console.error('[Материалы] Ошибка сохранения:', e)
  }
}

function editMaterial(m: any) {
  const date = new Date(m.operationDate)
  currentMaterial.value = {
    ...m,
    operationDate: isNaN(date.getTime())
      ? new Date().toISOString().split('T')[0]
      : date.toISOString().split('T')[0],
  }
  isEditing.value = true
  openModal(m.type)
}

async function deleteMaterial(id: number) {
  if (!confirm('Удалить этот материал?')) return
  try {
    await api.delete(`/api/materials/${id}`)
    localMaterials.value = localMaterials.value.filter(m => m.id !== id)
    emit('delete', id)
  } catch (e) {
    console.error('[Материалы] Ошибка удаления:', e)
  }
}

async function toggleCheck(m: any) {
  if (m.hasReceipt) return
  try {
    await api.patch(`/api/materials/${m.id}/toggle-check`, { hasReceipt: true })
    const item = localMaterials.value.find(x => x.id === m.id)
    if (item) item.hasReceipt = true
  } catch (e) {
    console.error('[Материалы] Ошибка переключения чека:', e)
  }
}

// ── Модалка ───────────────────────────────────────────────────────────
function openModal(type: 'incoming' | 'outgoing') {
  modalType.value = type
  if (!isEditing.value) resetForm()
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  nextTick(resetForm)
}

function resetForm() {
  currentMaterial.value = {
    id: null, name: '', amount: 0, comment: '',
    hasReceipt: false, objectId: props.objectId,
    type: modalType.value,
    operationDate: new Date().toISOString().split('T')[0],
  }
  isEditing.value = false
  formErrors.value = {}
}
</script>

<style lang="scss" scoped>
.mat {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

// ── Сводка ───────────────────────────────────────────────────────────
.mat-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);

  &__icon {
    width: 32px;
    height: 32px;
    border-radius: var(--crm-radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-lg);
    font-weight: 700;
  }

  &--income .summary-card__icon {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--expense .summary-card__icon {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &--total .summary-card__icon {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }
}

// ── Тулбар ───────────────────────────────────────────────────────────
.mat-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.mat-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.mat-actions {
  display: flex;
  gap: 8px;
}

.filter-select,
.filter-input {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border-hover);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  font-family: var(--crm-font-sans);
  padding: 5px 10px;
  outline: none;
  transition: var(--crm-transition);
  color-scheme: dark;

  &:focus {
    border-color: var(--crm-accent);
    box-shadow: 0 0 0 3px var(--crm-accent-dim);
  }

  option {
    background: var(--crm-bg-elevated);
    color: var(--crm-text-primary);
  }
}

.filter-sep {
  color: var(--crm-text-disabled);
  font-size: var(--crm-text-sm);
}

// ── Карточка таблицы ─────────────────────────────────────────────────
.mat-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
}

.mat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);
}

// ── Таблица ──────────────────────────────────────────────────────────
.mat-table-wrap {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--crm-bg-overlay) transparent;
}

.mat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--crm-text-sm);

  th {
    padding: 9px 14px;
    background: var(--crm-bg-elevated);
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
    text-align: left;
    white-space: nowrap;
    border-bottom: 1px solid var(--crm-border);
  }

  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--crm-border);
    color: var(--crm-text-secondary);
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.tr--alt td {
    background: rgba(255, 255, 255, 0.02);
  }

  tr:hover td {
    background: var(--crm-bg-elevated);
  }
}

.mat-row {
  &--incoming td:first-child {
    border-left: 3px solid var(--crm-success);
  }

  &--outgoing td:first-child {
    border-left: 3px solid var(--crm-danger);
  }
}

.td--date {
  color: var(--crm-text-muted);
  font-size: var(--crm-text-xs);
  white-space: nowrap;
}

.td--name {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
  color: var(--crm-text-primary);
}

.td--amount {
  font-weight: 700;
  white-space: nowrap;
}

.td--center {
  text-align: center;
}

.td--actions {
  white-space: nowrap;
  display: flex;
  gap: 4px;
  align-items: center;
}

// ── Тип-бейдж ────────────────────────────────────────────────────────
.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--crm-radius-sm);
  font-size: var(--crm-text-xs);
  font-weight: 600;

  &--incoming {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--outgoing {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }
}

// ── Чек ──────────────────────────────────────────────────────────────
.td--na {
  color: var(--crm-text-disabled);
  font-size: var(--crm-text-xs);
}

.receipt-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--crm-text-muted);
  transition: var(--crm-transition);
  padding: 2px;

  &--checked {
    color: var(--crm-success);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: .5;
  }

  &:not(.receipt-btn--checked):not(.receipt-btn--disabled):hover {
    color: var(--crm-success);
  }
}

// ── Кнопки действий ──────────────────────────────────────────────────
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--crm-radius-sm);
  color: var(--crm-text-muted);
  cursor: pointer;
  transition: var(--crm-transition);

  &:hover {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--danger:hover {
    background: var(--crm-danger-dim);
    border-color: rgba(242, 95, 92, .3);
    color: var(--crm-danger);
  }
}

// ── Цвета ────────────────────────────────────────────────────────────
.pos {
  color: var(--crm-success);
}

.neg {
  color: var(--crm-danger);
}

// ── Форма модалки ─────────────────────────────────────────────────────
.modal-form {
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
    color-scheme: dark;

    &::placeholder {
      color: var(--crm-text-disabled);
    }

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }

    &--error {
      border-color: var(--crm-danger);
    }

    &--textarea {
      resize: vertical;
      min-height: 60px;
    }
  }

  &__error {
    font-size: var(--crm-text-xs);
    color: var(--crm-danger);
  }

  &--checkbox {
    flex-direction: row;
    align-items: center;
  }
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  accent-color: var(--crm-accent);
  cursor: pointer;
}

.checkbox-text {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-secondary);
}

// ── CRM кнопки ────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;
  padding: 7px 13px;
  font-size: var(--crm-text-sm);

  &--xs {
    padding: 5px 8px;
    font-size: var(--crm-text-xs);
  }

  &:disabled {
    opacity: .45;
    cursor: not-allowed;
  }

  &--income {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, .35);
    color: var(--crm-success);

    &:hover {
      background: rgba(61, 214, 140, .25);
    }
  }

  &--expense {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, .35);
    color: var(--crm-danger);

    &:hover {
      background: rgba(242, 95, 92, .25);
    }
  }

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, .25);
    }
  }
}
</style>