<!-- app/components/pages/cabinet/Operation/index.vue -->
<template>
  <div class="operation-page">

    <!-- Заголовок -->
    <PagesCabinetUiLayoutPageTitle title="Операции" icon="mdi:swap-horizontal">
      <template #actions>
        <button class="crm-btn crm-btn--expense" @click="showExpenseModal = true">
          <Icon name="mdi:minus" size="15" />
          Расход
        </button>
        <button class="crm-btn crm-btn--income" @click="showIncomeModal = true">
          <Icon name="mdi:plus" size="15" />
          Приход
        </button>
      </template>
    </PagesCabinetUiLayoutPageTitle>

    <div class="operation-page__content">

      <!-- Фильтр дат -->
      <div class="operation-page__filter">
        <PagesCabinetOperationDateFilter :start-date="startDate" :end-date="endDate"
          @update:start-date="startDate = $event" @update:end-date="endDate = $event" @apply="applyFilter"
          @reset="resetFilter" />
      </div>

      <!-- Баланс -->
      <PagesCabinetOperationBalanceSummary :balance="balance" :loading="loadingBalance" :error="errorBalance"
        :expense-stats="expenseStats" />

      <!-- Список операций -->
      <PagesCabinetOperationOperationsList :expenses="filteredExpenses" :comings="filteredComings"
        :loading="loadingExpenses || loadingComings" :error="errorExpenses || errorComings"
        :object-labels="objectLabels" @filter-type="handleExpenseTypeFilter" />

    </div>

    <!-- Модальные окна -->
    <PagesCabinetOperationAddExpense :is-open="showExpenseModal" @close="showExpenseModal = false"
      @expense-added="handleExpenseAdded" />
    <PagesCabinetOperationAddIncome :is-open="showIncomeModal" @close="showIncomeModal = false"
      @income-added="handleIncomeAdded" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()

// ── Фильтры ─────────────────────────────────────────────────────────
const startDate = ref('')
const endDate = ref('')

// ── Баланс ──────────────────────────────────────────────────────────
const balance = ref < any > (null)
const loadingBalance = ref(true)
const errorBalance = ref < string | null > (null)

// ── Операции ────────────────────────────────────────────────────────
const expenses = ref < any[] > ([])
const comings = ref < any[] > ([])
const loadingExpenses = ref(false)
const loadingComings = ref(false)
const errorExpenses = ref < string | null > (null)
const errorComings = ref < string | null > (null)

// ── Статистика ───────────────────────────────────────────────────────
const expenseStats = ref < any[] > ([])

// ── Справочники ─────────────────────────────────────────────────────
const objectLabels = ref < Record < number, string>> ({})

// ── UI ───────────────────────────────────────────────────────────────
const showExpenseModal = ref(false)
const showIncomeModal = ref(false)
const selectedExpenseType = ref('')

// ── Computed ────────────────────────────────────────────────────────
const filteredExpenses = computed(() => {
  if (!startDate.value || !endDate.value) return expenses.value
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  return expenses.value.filter(e => {
    if (!e?.operationDate) return false
    const d = new Date(e.operationDate)
    return d >= start && d <= end
  })
})

const filteredComings = computed(() => {
  if (!startDate.value || !endDate.value) return comings.value
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  return comings.value.filter(c => {
    if (!c?.operationDate) return false
    const d = new Date(c.operationDate)
    return d >= start && d <= end
  })
})

// ── Загрузка ────────────────────────────────────────────────────────
function getParams() {
  return startDate.value && endDate.value
    ? { startDate: startDate.value, endDate: endDate.value }
    : {}
}

async function loadBalance() {
  loadingBalance.value = true
  errorBalance.value = null
  try {
    balance.value = await api.get('/api/balance', { params: getParams() })
  } catch {
    errorBalance.value = 'Не удалось загрузить баланс'
  } finally {
    loadingBalance.value = false
  }
}

async function loadExpenses() {
  loadingExpenses.value = true
  errorExpenses.value = null
  try {
    const data = await api.get<any[]>('/api/expenses', { params: getParams() })
    expenses.value = Array.isArray(data) ? data : []
  } catch {
    errorExpenses.value = 'Не удалось загрузить расходы'
  } finally {
    loadingExpenses.value = false
  }
}

async function loadComings() {
  loadingComings.value = true
  errorComings.value = null
  try {
    const data = await api.get<any[]>('/api/comings', { params: getParams() })
    comings.value = Array.isArray(data) ? data : []
  } catch {
    errorComings.value = 'Не удалось загрузить приходы'
  } finally {
    loadingComings.value = false
  }
}

async function loadExpenseStats() {
  try {
    expenseStats.value = await api.get<any[]>('/api/expenses/stats', { params: getParams() }) || []
  } catch (e) {
    console.error('[Операции] Ошибка загрузки статистики:', e)
  }
}

async function loadObjectLabels() {
  try {
    const data = await api.get<any[]>('/api/objects')
      ; (data || []).forEach(obj => { objectLabels.value[obj.id] = obj.name })
  } catch (e) {
    console.error('[Операции] Ошибка загрузки объектов:', e)
  }
}

// ── Управление фильтрами ─────────────────────────────────────────────
function applyFilter() {
  if (!startDate.value || !endDate.value) return
  loadBalance()
  loadExpenses()
  loadComings()
  loadExpenseStats()
}

function resetFilter() {
  startDate.value = ''
  endDate.value = ''
  loadBalance()
  loadExpenses()
  loadComings()
  loadExpenseStats()
}

// ── Обработка событий ────────────────────────────────────────────────
function handleExpenseTypeFilter(type: string) {
  selectedExpenseType.value = type
}

function handleExpenseAdded() {
  loadExpenses()
  loadBalance()
  loadExpenseStats()
}

function handleIncomeAdded() {
  loadComings()
  loadBalance()
}

// ── Инициализация ────────────────────────────────────────────────────
onMounted(() => {
  loadBalance()
  loadExpenseStats()
  loadObjectLabels()
  loadExpenses()
  loadComings()
})
</script>

<style lang="scss" scoped>
.operation-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px 24px;
  }

  &__filter {
    background: var(--crm-bg-surface);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-lg);
    padding: 14px 16px;
  }
}

// ── Кнопки действий ─────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--crm-radius-md);
  font-size: var(--crm-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: var(--crm-transition);

  &--expense {
    background: var(--crm-danger-dim);
    border: 1px solid rgba(242, 95, 92, 0.35);
    color: var(--crm-danger);

    &:hover {
      background: rgba(242, 95, 92, 0.25);
    }
  }

  &--income {
    background: var(--crm-success-dim);
    border: 1px solid rgba(61, 214, 140, 0.35);
    color: var(--crm-success);

    &:hover {
      background: rgba(61, 214, 140, 0.25);
    }
  }
}

@media (max-width: 767.98px) {
  .operation-page__content {
    padding: 16px;
  }
}
</style>