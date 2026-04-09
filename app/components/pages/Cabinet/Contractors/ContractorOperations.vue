<!-- app/components/pages/cabinet/Contractors/ContractorOperations.vue -->
<template>
  <div class="contractor-operations">

    <!-- ═══════════════════════════ HEADER ════════════════════════════ -->
    <div class="contractor-operations__header">
      <h3 class="contractor-operations__title">
        <Icon name="mdi:history" size="18" />
        История операций
      </h3>
      <div class="contractor-operations__controls">
        <button 
          class="crm-btn crm-btn--sm crm-btn--ghost"
          @click="refreshOperations"
          :disabled="loading"
        >
          <Icon name="mdi:refresh" size="13" :class="{ spin: loading }" />
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════ FILTERS ════════════════════════════ -->
    <div class="contractor-operations__filters">
      <div class="filter-group">
        <label class="filter-label">Тип операций</label>
        <select v-model="selectedSection" class="filter-select">
          <option value="all">Все операции</option>
          <option value="balance">Взаиморасчёты (Работа)</option>
          <option value="additional">Дополнительные (ЗП, Топливо)</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Период</label>
        <select v-model="selectedPeriod" class="filter-select">
          <option value="">Все время</option>
          <option value="week">Неделя</option>
          <option value="month">Месяц</option>
          <option value="quarter">Квартал</option>
          <option value="year">Год</option>
        </select>
      </div>
    </div>

    <!-- ═══════════════════════════ CONTENT ════════════════════════════ -->

    <!-- Загрузка -->
    <div v-if="loading" class="contractor-operations__skeleton">
      <div v-for="i in 3" :key="i" class="operation-skeleton">
        <div class="skel skel--avatar" />
        <div class="skel-info">
          <div class="skel skel--title" />
          <div class="skel skel--text" />
        </div>
      </div>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="contractor-operations__error">
      <Icon name="mdi:alert-circle-outline" size="24" />
      <span>{{ error }}</span>
      <button class="crm-btn crm-btn--sm crm-btn--ghost" @click="refreshOperations">
        <Icon name="mdi:refresh" size="13" />
        Повторить
      </button>
    </div>

    <!-- Пусто -->
    <div v-else-if="filteredOperations.length === 0 && filteredAdditional.length === 0" class="contractor-operations__empty">
      <Icon name="mdi:inbox-outline" size="28" />
      <span>Нет операций</span>
    </div>

    <!-- ════════════════════════ ОСНОВНАЯ ИСТОРИЯ ═══════════════════════ -->
    <div v-if="showBalanceSection" class="operations-section">
      <div class="operations-section__header">
        <h4 class="operations-section__title">
          <Icon name="mdi:handshake" size="16" />
          Взаиморасчёты (влияет на баланс)
        </h4>
        <span class="operations-section__count">{{ filteredOperations.length }}</span>
      </div>

      <div v-if="filteredOperations.length === 0" class="operations-section__empty">
        <Icon name="mdi:check-circle-outline" size="24" />
        <span>Нет операций по работам</span>
      </div>

      <div v-else class="operations-list">
        <div 
          v-for="operation in filteredOperations" 
          :key="`balance-${operation.id}`"
          :class="['operation-item', `operation-item--${operation.type}`]"
        >
          <div class="operation-item__left">
            <div :class="['operation-icon', `operation-icon--${operation.type}`]">
              <Icon :name="getOperationIcon(operation.type)" size="16" />
            </div>
            <div class="operation-info">
              <div class="operation-info__title">{{ operation.title }}</div>
              <div class="operation-info__meta">
                <span class="operation-info__date">{{ formatDate(operation.date) }}</span>
                <NuxtLink 
                  v-if="operation.object && operation.objectId" 
                  :to="`/cabinet/objects/${operation.objectId}`"
                  class="operation-info__object operation-info__link"
                  target="_blank"
                >
                  <Icon name="mdi:map-marker-outline" size="12" />
                  {{ operation.object }}
                  <Icon name="mdi:open-in-new" size="10" class="link-icon" />
                </NuxtLink>
                <span v-else-if="operation.object" class="operation-info__object">
                  <Icon name="mdi:map-marker-outline" size="12" />
                  {{ operation.object }}
                </span>
                <span v-if="operation.comment" class="operation-info__comment">
                  <Icon name="mdi:comment-outline" size="12" />
                  {{ operation.comment }}
                </span>
              </div>
            </div>
          </div>

          <div class="operation-item__right">
            <span :class="['operation-amount', `operation-amount--${operation.type}`]">
              {{ getAmountDisplay(operation) }}
            </span>
            <button 
              class="operation-btn" 
              @click="viewOperation(operation)"
              title="Открыть"
            >
              <Icon name="mdi:chevron-right" size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Итого по взаиморасчётам -->
      <div v-if="filteredOperations.length > 0" class="operations-section__footer">
        <div class="operations-summary">
          <div class="summary-item">
            <span class="summary-item__label">Расходы (Работа)</span>
            <span class="summary-item__value summary-item__value--expense">
              −{{ formatCurrency(totalExpenses) }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Приходы (Работы приняты)</span>
            <span class="summary-item__value summary-item__value--income">
              +{{ formatCurrency(totalIncomes) }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Итого</span>
            <span :class="['summary-item__value', getNetClass()]">
              {{ formatCurrency(netAmount) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ════════════════════════ ДОПОЛНИТЕЛЬНАЯ ИСТОРИЯ ═══════════════════════ -->
    <div v-if="showAdditionalSection" class="operations-section operations-section--additional">
      <div class="operations-section__header">
        <h4 class="operations-section__title">
          <Icon name="mdi:wallet-giftcard" size="16" />
          Выплаты (не влияют на баланс)
        </h4>
        <span class="operations-section__count">{{ filteredAdditional.length }}</span>
      </div>

      <div v-if="filteredAdditional.length === 0" class="operations-section__empty">
        <Icon name="mdi:information-outline" size="24" />
        <span>Нет дополнительных выплат</span>
      </div>

      <div v-else class="operations-list">
        <div 
          v-for="operation in filteredAdditional" 
          :key="`additional-${operation.id}`"
          class="operation-item operation-item--additional"
        >
          <div class="operation-item__left">
            <div class="operation-icon operation-icon--additional">
              <Icon :name="getAdditionalIcon(operation.expenseType)" size="16" />
            </div>
            <div class="operation-info">
              <div class="operation-info__title">{{ getAdditionalTitle(operation.expenseType) }}</div>
              <div class="operation-info__meta">
                <span class="operation-info__date">{{ formatDate(operation.date) }}</span>
                <span v-if="operation.object" class="operation-info__object">
                  <Icon name="mdi:map-marker-outline" size="12" />
                  {{ operation.object }}
                </span>
                <span v-if="operation.comment" class="operation-info__comment">
                  <Icon name="mdi:comment-outline" size="12" />
                  {{ operation.comment }}
                </span>
              </div>
            </div>
          </div>

          <div class="operation-item__right">
            <span class="operation-amount operation-amount--additional">
              {{ formatCurrency(operation.amount) }}
            </span>
            <button 
              class="operation-btn" 
              @click="viewOperation(operation)"
              title="Открыть"
            >
              <Icon name="mdi:chevron-right" size="16" />
            </button>
          </div>
        </div>
      </div>

      <!-- Итого по дополнительным -->
      <div v-if="filteredAdditional.length > 0" class="operations-section__footer">
        <div class="operations-summary operations-summary--additional">
          <div class="summary-item">
            <span class="summary-item__label">Зарплата</span>
            <span class="summary-item__value">
              {{ formatCurrency(totalSalary) }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Топливо</span>
            <span class="summary-item__value">
              {{ formatCurrency(totalFuel) }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-item__label">Всего доп.</span>
            <span class="summary-item__value summary-item__value--additional">
              {{ formatCurrency(totalAdditional) }}
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ContractorType } from '~/types/contractors'

interface Operation {
  id: number
  type: 'expense' | 'income'
  title: string
  amount: number
  date: string
  object?: string        // Название объекта (для отображения)
  objectId?: number      // ID объекта (для навигации)
  comment?: string
  expenseType?: string
}

const props = defineProps<{
  contractorId: number
  contractorType: ContractorType
}>()

// ── State ──────────────────────────────────────────────────────────
const operations = ref<Operation[]>([]) // Основная история (Работа)
const additionalOperations = ref<Operation[]>([]) // Доп. история (ЗП, Топливо)
const loading = ref(false)
const error = ref<string | null>(null)

const selectedSection = ref<'all' | 'balance' | 'additional'>('all')
const selectedPeriod = ref('')

// ── Computed ───────────────────────────────────────────────────────
const filteredOperations = computed(() => {
  let filtered = operations.value

  // Фильтр по периоду
  if (selectedPeriod.value) {
    const now = new Date()
    const filterDate = new Date()

    switch (selectedPeriod.value) {
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // ✅ Добавляем проверку на наличие даты
    filtered = filtered.filter(op => {
      if (!op.date) return false // Пропускаем операции без даты
      return new Date(op.date) >= filterDate
    })
  }

  // ✅ Сортировка с проверкой на undefined
  return filtered.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
})

const filteredAdditional = computed(() => {
  let filtered = additionalOperations.value

  // Фильтр по периоду
  if (selectedPeriod.value) {
    const now = new Date()
    const filterDate = new Date()

    switch (selectedPeriod.value) {
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        filterDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // ✅ Добавляем проверку на наличие даты
    filtered = filtered.filter(op => {
      if (!op.date) return false
      return new Date(op.date) >= filterDate
    })
  }

  // ✅ Сортировка с проверкой
  return filtered.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
})

// Показывать секции в зависимости от фильтра
const showBalanceSection = computed(() => {
  return selectedSection.value === 'all' || selectedSection.value === 'balance'
})

const showAdditionalSection = computed(() => {
  return selectedSection.value === 'all' || selectedSection.value === 'additional'
})

// Итого по взаиморасчётам
const totalExpenses = computed(() => {
  return filteredOperations.value
    .filter(op => op.type === 'expense')
    .reduce((sum, op) => sum + op.amount, 0)
})

const totalIncomes = computed(() => {
  return filteredOperations.value
    .filter(op => op.type === 'income')
    .reduce((sum, op) => sum + op.amount, 0)
})

const netAmount = computed(() => totalIncomes.value - totalExpenses.value)

// Итого по дополнительным
const totalSalary = computed(() => {
  return filteredAdditional.value
    .filter(op => op.expenseType === 'Зарплата')
    .reduce((sum, op) => sum + op.amount, 0)
})

const totalFuel = computed(() => {
  return filteredAdditional.value
    .filter(op => op.expenseType === 'Топливо')
    .reduce((sum, op) => sum + op.amount, 0)
})

const totalAdditional = computed(() => {
  return totalSalary.value + totalFuel.value
})

// ── Вспомогательные функции ────────────────────────────────────────
function getOperationIcon(type: 'expense' | 'income'): string {
  return type === 'expense' ? 'mdi:minus' : 'mdi:plus'
}

function getAdditionalIcon(expenseType?: string): string {
  if (expenseType === 'Зарплата') return 'mdi:cash-multiple'
  return 'mdi:gas-station' // Дефолт для "Топливо" и undefined
}

function getAdditionalTitle(expenseType?: string): string {
  if (expenseType === 'Зарплата') return 'Зарплата'
  return 'Топливо' // Дефолт
}

function getAmountDisplay(operation: Operation): string {
  const sign = operation.type === 'expense' ? '−' : '+'
  return `${sign}${formatCurrency(operation.amount)}`
}

function formatCurrency(amount: number): string {
  return Math.abs(amount).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  
  try {
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '—'
    
    // ✅ Всегда возвращаем дату в формате ДД.ММ.ГГ
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
  if (netAmount.value > 0) return 'summary-item__value--positive'
  if (netAmount.value < 0) return 'summary-item__value--negative'
  return 'summary-item__value--neutral'
}

// ── Обработчики ───────────────────────────────────────────────────
async function loadOperations() {
  loading.value = true
  error.value = null

  try {
    // Загружаем расходы (все типы)
    const expensesResponse = await $fetch<any[]>(
      `/api/expenses?contractorType=${props.contractorType}&contractorId=${props.contractorId}`
    )
    
    // Загружаем работы (только оплаченные)
    const worksResponse = await $fetch<any[]>(
      `/api/works?contractorType=${props.contractorType}&contractorId=${props.contractorId}`
    )

    // Разделяем расходы на типы
    const balanceOperations = (expensesResponse || [])
      .filter(e => e.expenseType === 'Работа')
      .map(e => ({
        id: e.id,
        type: 'expense' as const,
        title: 'Расход (Работа)',
        amount: parseFloat(e.amount),
        date: e.operationDate,
        object: e.objectName,
        objectId: e.objectId,      // ✅ Добавляем ID
        comment: e.comment,
        expenseType: e.expenseType
      }))

      const additionalOps = (expensesResponse || [])
        .filter(e => ['Зарплата', 'Топливо'].includes(e.expenseType))
        .map(e => ({
          id: e.id,
          type: 'expense' as const,
          title: getAdditionalTitle(e.expenseType),
          amount: parseFloat(e.amount),
          date: e.operationDate,
          object: e.objectName,
          objectId: e.objectId,      // ✅ Добавляем ID
          comment: e.comment,
          expenseType: e.expenseType
        }))

      const incomes = (worksResponse || [])
        .filter(w => w.paid === true)
        .map(w => ({
          id: w.id,
          type: 'income' as const,
          title: `Работа: ${w.workTypes}`,
          amount: parseFloat(w.workerAmount),
          date: w.operationDate,
          object: w.objectName,      // ✅ Используем имя, а не ID
          objectId: w.objectId,      // ✅ Сохраняем ID для навигации
          comment: w.comment,
          expenseType: 'Работа'
        }))

    operations.value = [...balanceOperations, ...incomes]
    additionalOperations.value = additionalOps
  } catch (err: any) {
    error.value = err?.message || 'Ошибка загрузки операций'
    console.error('[ContractorOperations] Ошибка:', err)
  } finally {
    loading.value = false
  }
}

function refreshOperations() {
  loadOperations()
}

function viewOperation(operation: Operation) {
  console.log('View operation:', operation)
  // Здесь можно открыть модальное окно с деталями
}

// ── Lifecycle ──────────────────────────────────────────────────────
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

// ── Заголовок ──────────────────────────────────────────────────────
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

// ── Фильтры ────────────────────────────────────────────────────────
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

  &:focus {
    border-color: var(--crm-accent);
  }

  color-scheme: dark;
}

// ── Секции операций ────────────────────────────────────────────────
.operations-section {
  border-top: 1px solid var(--crm-border);
  
  &--additional {
    background: var(--crm-bg-elevated);
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--crm-bg-overlay);
    border-bottom: 1px solid var(--crm-border);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-text-secondary);
    margin: 0;
  }

  &__count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    background: var(--crm-bg-surface);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-sm);
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-text-muted);
    padding: 0 6px;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 30px 20px;
    color: var(--crm-text-muted);
    text-align: center;
    font-size: var(--crm-text-sm);
  }

  &__footer {
    padding: 12px 16px;
    border-top: 1px solid var(--crm-border);
    background: var(--crm-bg-surface);
  }
}

// ── Список операций ────────────────────────────────────────────────
.operations-list {
  display: flex;
  flex-direction: column;
  max-height: 800px;
  overflow-y: auto;
}

.operation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
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

  &--additional {
    border-left: 3px solid var(--crm-accent);
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
  width: 36px;
  height: 36px;
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

  &--additional {
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
  }
}

.operation-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  &__title {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-primary);
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    min-height: 14px;
  }

  &__date {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__object,
  &__comment {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

.operation-info__link {
  color: var(--crm-accent);
  text-decoration: none;
  transition: var(--crm-transition);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    color: var(--crm-accent-hover);
    text-decoration: underline;
    
    .link-icon {
      transform: translateX(2px);
    }
  }
  
  .link-icon {
    opacity: 0.7;
    transition: transform 0.2s ease;
  }
}

.operation-info__object {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--crm-text-xs);
  color: var(--crm-text-muted);
  
  // Если объект без ссылки — чуть приглушённый цвет
  &:not(.operation-info__link) {
    opacity: 0.9;
  }
}

.operation-item__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 12px;
}

.operation-amount {
  font-size: var(--crm-text-md);
  font-weight: 700;
  font-family: var(--crm-font-mono);
  white-space: nowrap;

  &--expense {
    color: var(--crm-danger);
  }

  &--income {
    color: var(--crm-success);
  }

  &--additional {
    color: var(--crm-accent);
  }
}

.operation-btn {
  background: none;
  border: none;
  color: var(--crm-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: var(--crm-transition);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }
}

// ── Подвал ─────────────────────────────────────────────────────────
.operations-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;

  &--additional {
    .summary-item__value {
      color: var(--crm-accent);
    }
  }
}

.summary-item {
  display: flex;
  align-items: baseline;
  gap: 8px;

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__value {
    font-size: var(--crm-text-md);
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

    &--additional {
      color: var(--crm-accent);
    }
  }
}

// ── Пусто ──────────────────────────────────────────────────────────
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

// ── Ошибка ────────────────────────────────────────────────────────
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

// ── Скелетон ───────────────────────────────────────────────────────
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

  &--avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &--title {
    height: 14px;
    width: 100px;
  }

  &--text {
    height: 12px;
    width: 140px;
    margin-top: 4px;
  }
}

.skel-info {
  flex: 1;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

// ── Кнопка ────────────────────────────────────────────────────────
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

  &--sm {
    padding: 5px 9px;
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

@media (max-width: 600px) {
  .contractor-operations__filters {
    padding: 10px 12px;
  }

  .operation-item {
    padding: 10px 12px;
  }

  .operations-section__footer {
    padding: 10px 12px;
  }

  .operations-summary {
    gap: 12px;
  }
}
</style>