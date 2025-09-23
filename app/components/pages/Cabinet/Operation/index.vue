<template>
  <PagesCabinetUiLayoutPageTitle title="Операции">
    <template #actions>
      <div class="action-buttons">
        <button @click="showExpenseModal = true" class="btn btn-danger">
          + Расход
        </button>
        <button @click="showIncomeModal = true" class="btn btn-success">
          + Приход
        </button>
      </div>
    </template>
  </PagesCabinetUiLayoutPageTitle>

  <div class="operations-history">
    <!-- Фильтр -->
    <div class="filter-wrapper">
      <PagesCabinetOperationDateFilter
        :start-date="startDate"
        :end-date="endDate"
        @update:start-date="startDate = $event"
        @update:end-date="endDate = $event"
        @apply="applyFilter"
        @reset="resetFilter"
      />
    </div>

    <!-- Баланс -->
    <div class="balance-wrapper">
      <PagesCabinetOperationBalanceSummary
        :balance="balance"
        :loading="loadingBalance"
        :error="errorBalance"
        :expense-stats="expenseStats"
      />
    </div>

    <!-- Уведомления -->
    <transition name="fade">
      <div v-if="successMessage" class="notification success">
        {{ successMessage }}
      </div>
    </transition>
    <transition name="fade">
      <div v-if="errorMessage" class="notification error">
        {{ errorMessage }}
      </div>
    </transition>

    <!-- Модальные окна -->
    <PagesCabinetOperationAddExpense
      :is-open="showExpenseModal"
      @close="showExpenseModal = false"
      @expense-added="handleExpenseAdded"
    />
    <PagesCabinetOperationAddIncome
      :is-open="showIncomeModal"
      @close="showIncomeModal = false"
      @income-added="handleIncomeAdded"
    />

    <!-- Операции (вынесено в отдельный компонент) -->
    <PagesCabinetOperationOperationsList
      :expenses="filteredExpenses"
      :comings="filteredComings"
      :loading="loadingExpenses || loadingComings"
      :error="errorExpenses || errorComings"
      :object-labels="objectLabels"
      @filter-type="handleExpenseTypeFilter"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Фильтры
const startDate = ref('')
const endDate = ref('')

// Баланс
const balance = ref(null)
const loadingBalance = ref(true)
const errorBalance = ref(null)

// Операции
const expenses = ref([])
const comings = ref([])
const loadingExpenses = ref(false)
const loadingComings = ref(false)
const errorExpenses = ref(null)
const errorComings = ref(null)

// Статистика расходов
const expenseStats = ref([])
const loadingStats = ref(false)
const errorStats = ref(null)

// Дополнительные данные (справочники)
const objectLabels = ref({})
const contractorLabels = ref({ master: {}, worker: {} })

// UI состояния
const showExpenseModal = ref(false)
const showIncomeModal = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Вычисляемые отфильтрованные списки
const filteredExpenses = computed(() => {
  if (!startDate.value || !endDate.value) return expenses.value
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  return expenses.value.filter(expense => {
    if (!expense?.operationDate) return false
    const date = new Date(expense.operationDate)
    return date >= start && date <= end
  })
})

const filteredComings = computed(() => {
  if (!startDate.value || !endDate.value) return comings.value
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  return comings.value.filter(coming => {
    if (!coming?.operationDate) return false
    const date = new Date(coming.operationDate)
    return date >= start && date <= end
  })
})

// Загрузка данных
const loadBalance = async () => {
  loadingBalance.value = true
  errorBalance.value = null
  try {
    const params = {}
    if (startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    }
    balance.value = await $fetch('/api/balance', { params })
  } catch (e) {
    errorBalance.value = 'Не удалось загрузить баланс'
  } finally {
    loadingBalance.value = false
  }
}

const loadExpenses = async () => {
  loadingExpenses.value = true
  errorExpenses.value = null
  try {
    const params = {}
    if (startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    }
    const data = await $fetch('/api/expenses', { params })
    expenses.value = Array.isArray(data) ? data : []
  } catch (e) {
    errorExpenses.value = 'Не удалось загрузить расходы'
  } finally {
    loadingExpenses.value = false
  }
}

const loadComings = async () => {
  loadingComings.value = true
  errorComings.value = null
  try {
    const params = {}
    if (startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    }
    const data = await $fetch('/api/comings', { params })
    comings.value = Array.isArray(data) ? data : []
  } catch (e) {
    errorComings.value = 'Не удалось загрузить приходы'
  } finally {
    loadingComings.value = false
  }
}

// Загрузка статистики по расходам
const loadExpenseStats = async () => {
  loadingStats.value = true
  errorStats.value = null
  try {
    const params = {}
    if (startDate.value && endDate.value) {
      params.startDate = startDate.value
      params.endDate = endDate.value
    }
    expenseStats.value = await $fetch('/api/expenses/stats', { params })
  } catch (e) {
    errorStats.value = 'Не удалось загрузить статистику расходов'
    console.error(e)
  } finally {
    loadingStats.value = false
  }
}

// Загрузка справочников
const loadObjectLabels = async () => {
  try {
    const data = await $fetch('/api/objects')
    data.forEach(obj => (objectLabels.value[obj.id] = obj.name))
  } catch (e) {
    console.error('Ошибка загрузки объектов:', e)
  }
}

const loadContractorLabels = async () => {
  try {
    const [masters, workers] = await Promise.all([
      $fetch('/api/contractors/masters'),
      $fetch('/api/contractors/workers')
    ])
    masters.forEach(m => (contractorLabels.value.master[m.id] = m.name))
    workers.forEach(w => (contractorLabels.value.worker[w.id] = w.name))
  } catch (e) {
    console.error('Ошибка загрузки контрагентов:', e)
  }
}

// Фильтр по типу расхода
const selectedExpenseType = ref('')

const handleExpenseTypeFilter = (type) => {
  selectedExpenseType.value = type
}

// Управление фильтрами
const applyFilter = () => {
  if (startDate.value && endDate.value) {
    loadExpenses()
    loadComings()
    loadBalance()
    loadExpenseStats()
  }
}

const resetFilter = () => {
  startDate.value = ''
  endDate.value = ''
  loadExpenses()
  loadComings()
  loadBalance()
  loadExpenseStats()
}

// Обработка событий из модальных окон
const handleExpenseAdded = () => {
  successMessage.value = 'Расход успешно добавлен'
  loadExpenses()
  loadBalance()
}

const handleIncomeAdded = () => {
  successMessage.value = 'Приход успешно добавлен'
  loadComings()
  loadBalance()
}

// Загрузка при монтировании
onMounted(() => {
  loadBalance()
  loadExpenseStats()
  loadObjectLabels()
  loadContractorLabels()
  loadExpenses()
  loadComings()
})
</script>

<style lang="scss" scoped>
.operations-history {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;

  .filter-wrapper {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .notification {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    &.success {
      background: #e6f9ee;
      color: #207d40;
      border: 1px solid #b3e6c8;
    }
    &.error {
      background: #fdeaea;
      color: #b12d2d;
      border: 1px solid #f5c2c2;
    }
  }

  /* Анимации */
  .fade-enter-active, .fade-leave-active {
    transition: opacity .3s;
  }
  .fade-enter-from, .fade-leave-to {
    opacity: 0;
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  .btn {
    padding: 0.5rem 1.25rem;
    &-danger {
      background: #ff5a5a;
      color: #fff;
      &:hover { background: #e64a4a; }
    }
    &-success {
      background: #4caf50;
      color: #fff;
      &:hover { background: #449d48; }
    }
  }
}
</style>