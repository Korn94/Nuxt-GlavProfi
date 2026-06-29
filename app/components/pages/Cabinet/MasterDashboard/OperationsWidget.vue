// app/components/pages/cabinet/MasterDashboard/OperationsWidget.vue
<template>
  <div class="operations-widget">
    <!-- Заголовок -->
    <div class="operations-widget__header">
      <div class="operations-widget__title">
        <Icon name="mdi:history" size="20" />
        <span>История операций</span>
      </div>
      <div class="operations-widget__controls">
        <button class="crm-btn crm-btn--sm crm-btn--ghost" @click="loadOperations" :disabled="loading" title="Обновить">
          <Icon name="mdi:refresh" size="16" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <!-- Фильтры -->
    <div class="operations-widget__filters">
      <div class="filter-group">
        <label class="filter-label">Период:</label>
        <select v-model="periodPreset" class="filter-select">
          <option value="">Все время</option>
          <option value="week">Неделя</option>
          <option value="month">Месяц</option>
          <option value="quarter">Квартал</option>
          <option value="year">Год</option>
        </select>
      </div>
      <div class="filter-group">
        <label class="filter-label">Тип:</label>
        <select v-model="balanceFilter" class="filter-select">
          <option value="all">Все</option>
          <option value="income">Приходы</option>
          <option value="expense">Расходы</option>
        </select>
      </div>
    </div>

    <!-- Контент -->
    <div v-if="loading" class="operations-widget__skeleton">
      <div v-for="i in 5" :key="i" class="operation-skeleton">
        <div class="skel skel--icon" />
        <div class="skel-info">
          <div class="skel skel--title" />
          <div class="skel skel--text" />
        </div>
        <div class="skel skel--amount" />
      </div>
    </div>

    <div v-else-if="error" class="operations-widget__error">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--sm crm-btn--ghost" @click="loadOperations">
        <Icon name="mdi:refresh" size="13" />
        Повторить
      </button>
    </div>

    <div v-else-if="filteredOperations.length === 0" class="operations-widget__empty">
      <Icon name="mdi:inbox-outline" size="48" />
      <span>Нет операций за выбранный период</span>
    </div>

    <div v-else class="operations-widget__list">
      <div v-for="operation in filteredOperations" :key="operation.id"
        :class="['operation-item', `operation-item--${operation.type}`]">
        <div class="operation-item__left">
          <div :class="['operation-icon', `operation-icon--${operation.type}`]">
            <Icon :name="operation.type === 'expense' ? 'mdi:minus' : 'mdi:plus'" size="18" />
          </div>
          <div class="operation-info">
            <!-- ✅ Используем getDisplayTitle вместо operation.title -->
            <div class="operation-info__title">{{ getDisplayTitle(operation) }}</div>
            <div class="operation-info__meta">
              <span class="operation-info__date">{{ formatDate(operation.date) }}</span>
              <span v-if="operation.comment" class="operation-info__comment">
                <Icon name="mdi:comment-outline" size="12" />
                {{ operation.comment }}
              </span>
            </div>
          </div>
        </div>
        <div class="operation-item__right">
          <span :class="['operation-amount', `operation-amount--${operation.type}`]">
            {{ operation.type === 'expense' ? '−' : '+' }}{{ formatCurrency(operation.amount) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Итоги -->
    <div v-if="filteredOperations.length > 0" class="operations-widget__footer">
      <div class="operations-summary">
        <div class="summary-item">
          <span class="summary-item__label">Работ принято</span>
          <span class="summary-item__value summary-item__value--income">
            +{{ formatCurrency(totals.incomes) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">Оплатили</span>
          <span class="summary-item__value summary-item__value--expense">
            −{{ formatCurrency(totals.expenses) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">Итого</span>
          <span :class="['summary-item__value', getNetClass()]">
            {{ formatCurrency(totals.net) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContractorType } from '~/types/contractors'
import { useApi } from '~/composables/useApi'

// ── Интерфейсы ────────────────────────────────────────────────────────
interface Operation {
  id: number
  type: 'expense' | 'income'
  title: string
  amount: number
  date: string
  object?: number
  comment?: string
}

interface IncomeOperation {
  id: number
  type: 'income'
  title: string
  amount: number
  date: string
  object?: number
  comment?: string
  paymentDate?: string
  accepted: boolean
  workType: string
}

interface ExpenseOperation {
  id: number
  type: 'expense'
  title: string
  amount: number
  date: string
  object?: number
  comment?: string
  paymentDate?: string
}

const props = defineProps<{
  contractorId: number
  contractorType: ContractorType
}>()

const emit = defineEmits<{
  'balance-changed': []
}>()

const api = useApi()

// ── State ─────────────────────────────────────────────────────────────
const operations = ref<Operation[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const periodPreset = ref('')
const balanceFilter = ref<'all' | 'income' | 'expense'>('all')

// ── Фильтрация ────────────────────────────────────────────────────────
const filteredOperations = computed(() => {
  let filtered = [...operations.value]

  // Фильтр по периоду
  if (periodPreset.value) {
    const now = new Date()
    const filterDate = new Date()

    switch (periodPreset.value) {
      case 'week': filterDate.setDate(now.getDate() - 7); break
      case 'month': filterDate.setMonth(now.getMonth() - 1); break
      case 'quarter': filterDate.setMonth(now.getMonth() - 3); break
      case 'year': filterDate.setFullYear(now.getFullYear() - 1); break
    }

    filtered = filtered.filter(op => {
      if (!op.date) return false
      return new Date(op.date) >= filterDate
    })
  }

  // Фильтр по типу
  if (balanceFilter.value !== 'all') {
    filtered = filtered.filter(op => op.type === balanceFilter.value)
  }

  return filtered.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
})

const totals = computed(() => {
  const ops = filteredOperations.value
  const expenses = ops.filter(op => op.type === 'expense').reduce((s, op) => s + op.amount, 0)
  const incomes = ops.filter(op => op.type === 'income').reduce((s, op) => s + op.amount, 0)

  return {
    expenses,
    incomes,
    net: incomes - expenses
  }
})

// ── Helpers ───────────────────────────────────────────────────────────
// ✅ Кастомный заголовок для операций
function getDisplayTitle(operation: Operation): string {
  if (operation.type === 'expense') {
    return 'Оплачено'
  }
  // Для income оставляем существующий title (например "Работа принята: Плитка")
  return operation.title
}

function formatCurrency(amount: number): string {
  return Math.abs(amount).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  try {
    const date = new Date(dateStr)
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

// ── Загрузка операций ─────────────────────────────────────────────────
async function loadOperations() {
  loading.value = true
  error.value = null

  try {
    const [expensesResponse, incomesResponse] = await Promise.all([
      api.get<ExpenseOperation[]>(
        `/api/contractors/${props.contractorType}/${props.contractorId}/expenses`
      ),
      api.get<IncomeOperation[]>(
        `/api/contractors/${props.contractorType}/${props.contractorId}/incomes`
      )
    ])

    // Расходы
    const expenses: Operation[] = expensesResponse.map(e => ({
      id: e.id,
      type: 'expense' as const,
      title: e.title,
      amount: e.amount,
      date: e.date,
      object: e.object,
      comment: e.comment
    }))

    // Приходы (оплаченные работы)
    const incomes: Operation[] = incomesResponse.map(w => ({
      id: w.id,
      type: 'income' as const,
      title: w.title,
      amount: w.amount,
      date: w.date,
      object: w.object,
      comment: w.comment
    }))

    operations.value = [...expenses, ...incomes]
  } catch (err: any) {
    error.value = err?.message || 'Ошибка загрузки операций'
    console.error('[OperationsWidget] ❌ Ошибка:', err)
  } finally {
    loading.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(() => {
  if (props.contractorId) {
    loadOperations()
  }
})
</script>

<style lang="scss" scoped>
.operations-widget {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.operations-widget__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--crm-border);
}

.operations-widget__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--crm-text-lg);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.operations-widget__filters {
  display: flex;
  gap: 12px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--crm-border);
  background: var(--crm-bg-overlay);
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
  font-weight: 500;
}

.filter-select {
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-primary);
  font-size: var(--crm-text-sm);
  padding: 6px 10px;
  outline: none;
  cursor: pointer;
  transition: var(--crm-transition);

  &:focus {
    border-color: var(--crm-accent);
  }

  color-scheme: dark;

  option {
    background: var(--crm-bg-elevated);
    color: var(--crm-text-primary);
  }
}

.operations-widget__skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
}

.operation-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
}

.skel {
  border-radius: var(--crm-radius-md);
  background: linear-gradient(90deg,
      var(--crm-bg-overlay) 25%,
      var(--crm-border) 50%,
      var(--crm-bg-overlay) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;

  &--icon {
    width: 40px;
    height: 40px;
    border-radius: var(--crm-radius-md);
    flex-shrink: 0;
  }

  &--title {
    height: 16px;
    width: 200px;
  }

  &--text {
    height: 12px;
    width: 150px;
    margin-top: 4px;
  }

  &--amount {
    height: 20px;
    width: 100px;
    margin-left: auto;
  }
}

.skel-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.operations-widget__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  color: var(--crm-danger);
  text-align: center;
  font-size: var(--crm-text-sm);
}

.operations-widget__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--crm-text-muted);
  text-align: center;
  font-size: var(--crm-text-md);
}

.operations-widget__list {
  display: flex;
  flex-direction: column;
  max-height: 600px;
  overflow-y: auto;
}

.operation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--crm-border);
  transition: var(--crm-transition);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--crm-bg-overlay);
  }

  &--expense {
    border-left: 3px solid var(--crm-danger);
  }

  &--income {
    border-left: 3px solid var(--crm-success);
  }
}

.operation-item__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.operation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--crm-radius-md);
  flex-shrink: 0;

  &--expense {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &--income {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }
}

.operation-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  &__title {
    font-size: var(--crm-text-md);
    font-weight: 500;
    color: var(--crm-text-primary);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__date {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__comment {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

.operation-item__right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-left: 12px;
}

.operation-amount {
  font-size: var(--crm-text-lg);
  font-weight: 700;
  font-family: var(--crm-font-mono);
  white-space: nowrap;

  &--expense {
    color: var(--crm-danger);
  }

  &--income {
    color: var(--crm-success);
  }
}

.operations-widget__footer {
  padding: 16px 20px;
  border-top: 1px solid var(--crm-border);
  background: var(--crm-bg-surface);
}

.operations-summary {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 10px;

  &__label {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-lg);
    font-weight: 700;
    font-family: var(--crm-font-mono);

    &--positive {
      color: var(--crm-success);
    }

    &--negative {
      color: var(--crm-danger);
    }

    &--neutral {
      color: var(--crm-text-primary);
    }

    &--expense {
      color: var(--crm-danger);
    }

    &--income {
      color: var(--crm-success);
    }
  }
}

.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  border: 1px solid transparent;

  &--sm {
    padding: 6px 10px;
    font-size: var(--crm-text-xs);
  }

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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .operations-widget__filters {
    padding: 10px 16px;
  }

  .filter-group {
    flex-basis: 100%;
  }

  .filter-select {
    flex-grow: 1;
  }

  .operation-item {
    padding: 12px 16px;
  }

  .operations-summary {
    gap: 16px;
  }
}
</style>