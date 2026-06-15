<!-- app/components/pages/cabinet/Contractors/ContractorOperations/index.vue -->
<template>
  <div class="contractor-operations">

    <!-- HEADER -->
    <div class="contractor-operations__header">
      <h3 class="contractor-operations__title">
        <Icon name="mdi:history" size="18" />
        История операций
      </h3>
      <div class="contractor-operations__controls">
        <button
          class="crm-btn crm-btn--sm crm-btn--ghost"
          @click="loadOperations"
          :disabled="loading"
        >
          <Icon name="mdi:refresh" size="13" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="contractor-operations__filters">
      <div class="filter-group">
        <label class="filter-label">С</label>
        <input v-model="dateFrom" type="date" class="filter-date" :max="dateTo || undefined" />
      </div>
      <div class="filter-group">
        <label class="filter-label">По</label>
        <input v-model="dateTo" type="date" class="filter-date" :min="dateFrom || undefined" />
      </div>
      <div class="filter-group">
        <label class="filter-label">Период</label>
        <select v-model="periodPreset" class="filter-select">
          <option value="">Все время</option>
          <option value="week">Неделя</option>
          <option value="month">Месяц</option>
          <option value="quarter">Квартал</option>
          <option value="year">Год</option>
        </select>
      </div>
    </div>

    <!-- LOADING / ERROR / EMPTY -->
    <div v-if="loading" class="contractor-operations__skeleton">
      <div v-for="i in 3" :key="i" class="operation-skeleton">
        <div class="skel skel--avatar" />
        <div class="skel-info">
          <div class="skel skel--title" />
          <div class="skel skel--text" />
        </div>
      </div>
    </div>

    <div v-else-if="error" class="contractor-operations__error">
      <Icon name="mdi:alert-circle-outline" size="24" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--sm crm-btn--ghost" @click="loadOperations">
        <Icon name="mdi:refresh" size="13" />
        Повторить
      </button>
    </div>

    <div v-else-if="operations.length === 0 && additionalOperations.length === 0" class="contractor-operations__empty">
      <Icon name="mdi:inbox-outline" size="28" />
      <span>Нет операций</span>
    </div>

    <!-- СЕКЦИИ -->
    <template v-else>
      <!-- Секция взаиморасчётов -->
      <BalanceSection
        :operations="filteredOperations"
        v-model:balanceFilter="balanceFilter"
        :totals="{ expenses: totals.expenses, incomes: totals.incomes, net: totals.net }"
        :deletingId="deletingId"
        :formatCurrency="formatCurrency"
        :formatDate="formatDate"
        :getNetClass="getNetClass"
        @edit="startEdit"
        @delete="handleDelete"
      />

      <!-- Секция доп. выплат -->
      <AdditionalSection
        :operations="filteredAdditional"
        :totals="{ salary: totals.salary, fuel: totals.fuel, additional: totals.additional }"
        :deletingId="deletingId"
        :formatCurrency="formatCurrency"
        :formatDate="formatDate"
        @edit="startEdit"
        @delete="handleDelete"
      />
    </template>

    <!-- МОДАЛКА РЕДАКТИРОВАНИЯ -->
    <EditModal
      v-model="editModalVisible"
      :operation="editingOperation"
      :saving="savingEdit"
      @save="handleSaveEdit"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContractorType } from '~/types/contractors'
import { useApi } from '~/composables/useApi'
import BalanceSection from './BalanceSection.vue'
import AdditionalSection from './AdditionalSection.vue'
import EditModal from './EditModal.vue'

// ── Локальные типы ───────────────────────────────────────────────────
interface Operation {
  id: number
  type: 'expense' | 'income'
  title: string
  amount: number
  date: string
  object?: string
  objectId?: number
  comment?: string
  expenseType?: string
  workTypes?: string // 🔧 НОВОЕ: тип работы
}

interface EditFormData {
  amount: number
  comment: string
  date: string // 🔧 ИСПРАВЛЕНО: теперь только YYYY-MM-DD
  expenseType: string
  workTypes: string // 🔧 НОВОЕ
}

// ── Props / Emits ────────────────────────────────────────────────────
const props = defineProps<{
  contractorId: number
  contractorType: ContractorType
}>()

const emit = defineEmits<{
  'balance-changed': []
}>()

// ── API ──────────────────────────────────────────────────────────────
const api = useApi()

// ── State ────────────────────────────────────────────────────────────
const operations = ref<Operation[]>([])
const additionalOperations = ref<Operation[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Фильтры
const dateFrom = ref('')
const dateTo = ref('')
const periodPreset = ref('')
const balanceFilter = ref<'all' | 'payment' | 'accepted'>('all')

// Редактирование / Удаление
const editModalVisible = ref(false)
const savingEdit = ref(false)
const deletingId = ref<number | null>(null)
const editingOperation = ref<Operation | null>(null)

// ── Helpers: получение диапазона дат ─────────────────────────────────
function getDateRange() {
  const explicitFrom = dateFrom.value ? new Date(dateFrom.value) : null
  const explicitTo = dateTo.value ? new Date(dateTo.value) : null

  if (explicitFrom || explicitTo) {
    const from = explicitFrom
    const to = explicitTo
    if (to && !explicitFrom) to.setHours(23, 59, 59, 999)
    return { from, to }
  }

  if (!periodPreset.value) return { from: null, to: null }

  const now = new Date()
  const filterDate = new Date()

  switch (periodPreset.value) {
    case 'week': filterDate.setDate(now.getDate() - 7); break
    case 'month': filterDate.setMonth(now.getMonth() - 1); break
    case 'quarter': filterDate.setMonth(now.getMonth() - 3); break
    case 'year': filterDate.setFullYear(now.getFullYear() - 1); break
  }

  return { from: filterDate, to: null }
}

// ── Helpers: применение фильтра по датам ─────────────────────────────
function applyDateFilter<T extends { date: string }>(list: T[]): T[] {
  const { from, to } = getDateRange()
  let filtered = [...list]

  if (from) {
    filtered = filtered.filter(op => {
      if (!op.date) return false
      const opDate = new Date(op.date)
      return to ? (opDate >= from && opDate <= to) : opDate >= from
    })
  } else if (to) {
    filtered = filtered.filter(op => {
      if (!op.date) return false
      return new Date(op.date) <= to
    })
  }

  return filtered.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
}

// ── Computed: отфильтрованные списки ─────────────────────────────────
const filteredOperations = computed(() => {
  let filtered = applyDateFilter(operations.value)

  if (balanceFilter.value !== 'all') {
    filtered = filtered.filter(op => {
      if (balanceFilter.value === 'payment') return op.type === 'expense'
      if (balanceFilter.value === 'accepted') return op.type === 'income'
      return true
    })
  }

  return filtered
})

const filteredAdditional = computed(() => applyDateFilter(additionalOperations.value))

// ── Computed: итоги ──────────────────────────────────────────────────
const totals = computed(() => {
  const ops = filteredOperations.value
  const add = filteredAdditional.value

  const expenses = ops.filter(op => op.type === 'expense').reduce((s, op) => s + op.amount, 0)
  const incomes = ops.filter(op => op.type === 'income').reduce((s, op) => s + op.amount, 0)
  const salary = add.filter(op => op.expenseType === 'Зарплата').reduce((s, op) => s + op.amount, 0)
  const fuel = add.filter(op => op.expenseType === 'Топливо').reduce((s, op) => s + op.amount, 0)

  return {
    expenses,
    incomes,
    net: incomes - expenses,
    salary,
    fuel,
    additional: salary + fuel
  }
})

// ── Helpers: форматирование ──────────────────────────────────────────
function formatCurrency(amount: number): string {
  return Math.abs(amount).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

// 🔧 ИСПРАВЛЕНО: формат даты — только ДД.ММ.ГГ (без времени)
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  } catch {
    return '—'
  }
}

function getNetClass(): string {
  if (totals.value.net > 0) return 'summary-item__value--positive'
  if (totals.value.net < 0) return 'summary-item__value--negative'
  return 'summary-item__value--neutral'
}

// ── Загрузка операций ────────────────────────────────────────────────
async function loadOperations() {
  loading.value = true
  error.value = null

  try {
    const [expensesResponse, worksResponse] = await Promise.all([
      api.get<any[]>(`/api/expenses?contractorType=${props.contractorType}&contractorId=${props.contractorId}`),
      api.get<any[]>(`/api/works?contractorType=${props.contractorType}&contractorId=${props.contractorId}`)
    ])

    // Основная история (влияет на баланс)
    const balanceOps = (expensesResponse || [])
      .filter(e => e.expenseType === 'Работа')
      .map(e => ({
        id: e.id,
        type: 'expense' as const,
        title: 'Оплата',
        amount: parseFloat(e.amount),
        date: e.operationDate,
        object: e.objectName,
        objectId: e.objectId,
        comment: e.comment,
        expenseType: e.expenseType
      }))

    // Дополнительная история (не влияет на баланс)
    const additionalOps = (expensesResponse || [])
      .filter(e => ['Зарплата', 'Топливо', 'Налог', 'Реклама', 'Кредит', 'ГлавПрофи'].includes(e.expenseType))
      .map(e => ({
        id: e.id,
        type: 'expense' as const,
        title: e.expenseType,
        amount: parseFloat(e.amount),
        date: e.operationDate,
        object: e.objectName,
        objectId: e.objectId,
        comment: e.comment,
        expenseType: e.expenseType
      }))

    // Оплаченные работы (приходы) — 🔧 ТЕПЕРЬ СОХРАНЯЕМ workTypes
    const incomes = (worksResponse || [])
      .filter(w => w.paid === true)
      .map(w => ({
        id: w.id,
        type: 'income' as const,
        title: `Работа принята: ${w.workTypes}`,
        amount: parseFloat(w.workerAmount),
        date: w.operationDate,
        object: w.objectName,
        objectId: w.objectId,
        comment: w.comment,
        expenseType: 'Работа',
        workTypes: w.workTypes // 🔧 НОВОЕ
      }))

    operations.value = [...balanceOps, ...incomes]
    additionalOperations.value = additionalOps
  } catch (err: any) {
    error.value = err?.message || 'Ошибка загрузки операций'
    console.error('[Operations] ❌ Ошибка загрузки:', err)
  } finally {
    loading.value = false
  }
}

// ── Удаление операции ────────────────────────────────────────────────
async function handleDelete(operation: Operation) {
  const confirmMessage = operation.type === 'expense'
    ? `Удалить "${operation.title.toLowerCase()}" на ${formatCurrency(operation.amount)}?\n\n⚠️ Баланс контрагента будет пересчитан автоматически.`
    : `Удалить оплаченную работу на ${formatCurrency(operation.amount)}?\n\n⚠️ Баланс контрагента и объекта будут пересчитаны автоматически.`

  if (!confirm(confirmMessage)) return

  deletingId.value = operation.id

  try {
    const endpoint = operation.type === 'expense'
      ? `/api/expenses/${operation.id}`
      : `/api/works/${operation.id}`

    await api.delete(endpoint)

    operations.value = operations.value.filter(op => op.id !== operation.id)
    additionalOperations.value = additionalOperations.value.filter(op => op.id !== operation.id)

    console.log(`[Operations] ✅ Операция удалена: ID ${operation.id}`)
    emit('balance-changed')
  } catch (err: any) {
    console.error('[Operations] ❌ Ошибка удаления:', err)
    alert(err?.data?.message || 'Не удалось удалить операцию')
  } finally {
    deletingId.value = null
  }
}

// ── Редактирование операции ──────────────────────────────────────────
function startEdit(operation: Operation) {
  editingOperation.value = operation
  editModalVisible.value = true
}

// 🔧 ИСПРАВЛЕНО: передача workTypes и корректная обработка даты
async function handleSaveEdit(form: EditFormData) {
  if (!editingOperation.value) return

  savingEdit.value = true

  try {
    const endpoint = editingOperation.value.type === 'expense'
      ? `/api/expenses/${editingOperation.value.id}`
      : `/api/works/${editingOperation.value.id}`

    // 🔧 ИСПРАВЛЕНО: формируем дату с временем 12:00:00 (чтобы не было проблем с часовыми поясами)
    const operationDate = form.date
      ? new Date(form.date + 'T12:00:00').toISOString()
      : new Date().toISOString()

    const updateData: any = {
      comment: form.comment || null,
      operationDate,
      contractorType: props.contractorType,
      contractorId: props.contractorId
    }

    if (editingOperation.value.type === 'expense') {
      // Для расходов
      updateData.amount = form.amount.toString()
      updateData.expenseType = form.expenseType
    } else {
      // 🔧 НОВОЕ: Для работ — передаём workerAmount И workTypes
      updateData.workerAmount = form.amount.toString()
      updateData.workTypes = form.workTypes
    }

    await api.put(endpoint, updateData)

    console.log(`[Operations] ✅ Операция обновлена: ID ${editingOperation.value.id}`)

    editModalVisible.value = false
    emit('balance-changed')
    await loadOperations()
  } catch (err: any) {
    console.error('[Operations] ❌ Ошибка обновления:', err)
    alert(err?.data?.message || 'Не удалось обновить операцию')
  } finally {
    savingEdit.value = false
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(() => {
  loadOperations()
})
</script>

<style lang="scss" scoped>
.contractor-operations {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  overflow: hidden;
}

// ── Заголовок ────────────────────────────────────────────────────────
.contractor-operations__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--crm-border);
}

.contractor-operations__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--crm-text-md);
  font-weight: 600;
  color: var(--crm-text-primary);
  margin: 0;
}

.contractor-operations__controls {
  display: flex;
  gap: 6px;
}

// ── Фильтры ──────────────────────────────────────────────────────────
.contractor-operations__filters {
  display: flex;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--crm-border);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.filter-label {
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  font-weight: 500;
  white-space: nowrap;
}

.filter-select {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-xs);
  padding: 5px 8px;
  outline: none;
  cursor: pointer;
  transition: var(--crm-transition);

  &:focus { border-color: var(--crm-accent); }
  color-scheme: dark;

  option {
    background: var(--crm-bg-elevated);
    color: var(--crm-text-primary);
  }
}

.filter-date {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-xs);
  padding: 5px 8px;
  outline: none;
  cursor: pointer;
  transition: var(--crm-transition);

  &:focus { border-color: var(--crm-accent); }
  color-scheme: dark;

  &::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
}

// ── Состояния ────────────────────────────────────────────────────────
.contractor-operations__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--crm-text-muted);
  text-align: center;
  font-size: var(--crm-text-sm);
}

.contractor-operations__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 30px 20px;
  color: var(--crm-danger);
  text-align: center;
  font-size: var(--crm-text-sm);
}

.contractor-operations__skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
}

.operation-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skel {
  border-radius: var(--crm-radius-md);
  background: linear-gradient(90deg,
      var(--crm-bg-overlay) 25%,
      var(--crm-border) 50%,
      var(--crm-bg-overlay) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;

  &--avatar { width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0; }
  &--title { height: 14px; width: 100px; }
  &--text { height: 12px; width: 140px; margin-top: 4px; }
}

.skel-info { flex: 1; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ── Кнопки ───────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 9px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-xs);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  border: 1px solid transparent;

  &--sm { padding: 5px 9px; font-size: var(--crm-text-xs); }

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border);
    color: var(--crm-text-secondary);

    &:hover:not(:disabled) {
      background: var(--crm-bg-elevated);
      border-color: var(--crm-border-hover);
      color: var(--crm-text-primary);
    }
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.spin { animation: spin 1s linear infinite; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .contractor-operations__filters { padding: 10px 12px; }
  .filter-group { flex-basis: 100%; }
  .filter-date { flex-grow: 1; min-width: 0; }
}
</style>