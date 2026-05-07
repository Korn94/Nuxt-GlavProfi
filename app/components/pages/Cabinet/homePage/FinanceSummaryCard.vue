<!-- app/components/pages/cabinet/homePage/FinanceSummaryCard.vue -->
<template>
  <PagesCabinetUiCardsCard :loading="isLoading" title="Финансовая сводка" flush>
    <template #icon>
      <Icon name="mdi:finance" size="18" />
    </template>

    <template #actions>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="navigateTo('/cabinet/operation')">
        Подробнее
        <Icon name="mdi:arrow-right" size="14" />
      </button>
    </template>

    <div v-if="balanceData" class="finance">

      <!-- Итог -->
      <div class="finance__total">
        <span class="finance__total-label">Общий баланс за период</span>
        <span class="finance__total-value"
          :class="totalBalance >= 0 ? 'finance__total-value--pos' : 'finance__total-value--neg'">
          {{ formatCurrency(totalBalance) }}
        </span>
      </div>

      <!-- Три метрики -->
      <div class="finance__metrics">
        <div class="metric metric--income">
          <div class="metric__icon">
            <Icon name="mdi:trending-up" size="16" />
          </div>
          <div class="metric__info">
            <span class="metric__label">Приходы</span>
            <span class="metric__value">{{ formatCurrency(balanceData.totalComings) }}</span>
          </div>
        </div>

        <div class="metric metric--expense">
          <div class="metric__icon">
            <Icon name="mdi:trending-down" size="16" />
          </div>
          <div class="metric__info">
            <span class="metric__label">Расходы</span>
            <span class="metric__value">{{ formatCurrency(balanceData.totalExpenses) }}</span>
          </div>
        </div>

        <div class="metric metric--pending">
          <div class="metric__icon">
            <Icon name="mdi:clock-outline" size="16" />
          </div>
          <div class="metric__info">
            <span class="metric__label">В работе</span>
            <span class="metric__value">{{ formatCurrency(balanceData.pendingWorks) }}</span>
          </div>
        </div>

        <div class="metric metric--materials">
          <div class="metric__icon">
            <Icon name="mdi:package-variant" size="16" />
          </div>
          <div class="metric__info">
            <span class="metric__label">Материалы</span>
            <span class="metric__value">{{ formatCurrency(balanceData.materials?.balance) }}</span>
          </div>
        </div>
      </div>

      <!-- Категории расходов -->
      <div v-if="expenseCategories.length" class="finance__categories">
        <div class="finance__categories-header">
          <span class="finance__categories-title">Расходы по категориям</span>
          <span class="finance__categories-count">{{ expenseCategories.length }}</span>
        </div>
        <div class="categories">
          <div v-for="cat in expenseCategories" :key="cat.type" class="category">
            <div class="category__icon">
              <Icon :name="getCategoryIcon(cat.type)" size="16" />
            </div>
            <div class="category__info">
              <span class="category__label">{{ getCategoryLabel(cat.type) }}</span>
              <span class="category__amount">{{ formatCurrency(cat.amount) }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="finance-state">
      <Icon name="mdi:alert-circle-outline" size="32" />
      <p>Не удалось загрузить данные</p>
      <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="fetchData">
        <Icon name="mdi:refresh" size="14" /> Повторить
      </button>
    </div>

    <!-- Пусто -->
    <div v-else class="finance-state">
      <Icon name="mdi:finance" size="32" />
      <p>Нет данных за выбранный период</p>
    </div>

    <template #footer>
      <div class="finance-footer">
        <span>{{ currentMonth }}</span>
        <button class="crm-btn crm-btn--ghost crm-btn--xs" @click="showDateRange = !showDateRange">
          {{ showDateRange ? 'Скрыть фильтр' : 'Изменить период' }}
        </button>
      </div>

      <div v-if="showDateRange" class="date-range">
        <input type="date" v-model="localStartDate" class="date-range__input" :max="localEndDate" />
        <span class="date-range__sep">—</span>
        <input type="date" v-model="localEndDate" class="date-range__input" :min="localStartDate" />
        <button class="crm-btn crm-btn--accent crm-btn--sm" @click="applyDateRange">Применить</button>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="resetDateRange">Сброс</button>
      </div>
    </template>

  </PagesCabinetUiCardsCard>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { navigateTo } from '#app'
import { useApi } from '~/composables/useApi' // 👈 Новый composable

const api = useApi() // 👈 Инициализация

const balanceData = ref<any>(null)
const expenseCategories = ref<any[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const showDateRange = ref(false)
const localStartDate = ref('')
const localEndDate = ref('')

// ── Справочники ─────────────────────────────────────────────────────
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

const categoryMap: Record<string, { icon: string; label: string }> = {
  'Работа': { icon: 'mdi:hammer', label: 'Работы' },
  'Налог': { icon: 'mdi:currency-usd', label: 'Налоги' },
  'Зарплата': { icon: 'mdi:cash', label: 'Зарплаты' },
  'Реклама': { icon: 'mdi:bullhorn', label: 'Реклама' },
  'Кредит': { icon: 'mdi:bank', label: 'Кредиты' },
  'Топливо': { icon: 'mdi:gas-station', label: 'Топливо' },
  'ГлавПрофи': { icon: 'mdi:star', label: 'ГлавПрофи' },
}

// ── Вспомогательные ─────────────────────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')

function formatDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function getMonthRange(offset = 0) {
  const now = new Date()
  const month = now.getMonth() + offset
  const year = Math.floor((now.getFullYear() * 12 + month) / 12)
  const m = ((month % 12) + 12) % 12
  return {
    startDate: formatDate(new Date(year, m, 1)),
    endDate: formatDate(new Date(year, m + 1, 0)),
  }
}

const formatCurrency = (amount: any) =>
  (parseFloat(amount) || 0).toLocaleString('ru-RU', {
    style: 'currency', currency: 'RUB', minimumFractionDigits: 0
  })

const getCategoryIcon = (type: string) => categoryMap[type]?.icon ?? 'mdi:file-document-outline'
const getCategoryLabel = (type: string) => categoryMap[type]?.label ?? type

// ── Computed ────────────────────────────────────────────────────────
const totalBalance = computed(() =>
  (balanceData.value?.totalComings || 0) -
  (balanceData.value?.totalExpenses || 0) +
  (balanceData.value?.materials?.balance || 0)
)

const currentMonth = computed(() => {
  if (!localStartDate.value) return ''
  const d = new Date(localStartDate.value)
  return `${monthNames[d.getMonth()]} ${d.getFullYear()}`
})

// ── Загрузка ────────────────────────────────────────────────────────
async function fetchData() {
  isLoading.value = true
  error.value = null
  try {
    const params = localStartDate.value && localEndDate.value
      ? { startDate: localStartDate.value, endDate: localEndDate.value }
      : {}

    // 👇 Все запросы через api.get() — токен и credentials подставляются автоматически
    const [balance, stats] = await Promise.all([
      api.get<any>('/api/balance', { params }),
      api.get<any[]>('/api/expenses/stats', { params }),
    ])

    balanceData.value = balance

    const targetCats = ['Работа', 'Налог', 'Зарплата', 'Реклама', 'Кредит', 'Топливо', 'ГлавПрофи']
    expenseCategories.value = (stats || [])
      .filter(i => targetCats.includes(i.expenseType))
      .map(i => ({ type: i.expenseType, amount: i.total }))
      .sort((a, b) => b.amount - a.amount)

  } catch (e: any) {
    // 👇 Ошибки 401/403 уже обработаны в useApi(), здесь — только локальная логика UI
    console.error('[ФинСводка] Ошибка загрузки:', e)
    error.value = e?.message || 'Ошибка загрузки'
  } finally {
    isLoading.value = false
  }
}

function applyDateRange() {
  fetchData()
  showDateRange.value = false
}

function resetDateRange() {
  const { startDate, endDate } = getMonthRange(0)
  localStartDate.value = startDate
  localEndDate.value = endDate
  fetchData()
  showDateRange.value = false
}

onMounted(() => {
  const { startDate, endDate } = getMonthRange(0)
  localStartDate.value = startDate
  localEndDate.value = endDate
  fetchData()
})

watch([localStartDate, localEndDate], () => {
  if (localStartDate.value && localEndDate.value) fetchData()
})
</script>

<style lang="scss" scoped>
// ── Обёртка ─────────────────────────────────────────────────────────
.finance {
  display: flex;
  flex-direction: column;
}

// ── Итог ────────────────────────────────────────────────────────────
.finance__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--crm-border);

  &-label {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
  }

  &-value {
    font-size: var(--crm-text-xl);
    font-weight: 700;

    &--pos {
      color: var(--crm-success);
    }

    &--neg {
      color: var(--crm-danger);
    }
  }
}

// ── Метрики ─────────────────────────────────────────────────────────
.finance__metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-bottom: 1px solid var(--crm-border);

  @media (max-width: 700px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.metric {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-right: 1px solid var(--crm-border);

  &:last-child {
    border-right: none;
  }

  &__icon {
    width: 30px;
    height: 30px;
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
    min-width: 0;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
  }

  // Цвета по типу
  &--income .metric__icon {
    background: var(--crm-success-dim);
    color: var(--crm-success);
  }

  &--expense .metric__icon {
    background: var(--crm-danger-dim);
    color: var(--crm-danger);
  }

  &--pending .metric__icon {
    background: var(--crm-warning-dim);
    color: var(--crm-warning);
  }

  &--materials .metric__icon {
    background: var(--crm-info-dim);
    color: var(--crm-info);
  }
}

// ── Категории ───────────────────────────────────────────────────────
.finance__categories {
  padding: 14px 16px;
}

.finance__categories-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.finance__categories-title {
  font-size: var(--crm-text-sm);
  font-weight: 600;
  color: var(--crm-text-secondary);
}

.finance__categories-count {
  font-size: var(--crm-text-xs);
  font-weight: 600;
  padding: 1px 7px;
  background: var(--crm-bg-overlay);
  border: 1px solid var(--crm-border-hover);
  border-radius: 10px;
  color: var(--crm-text-muted);
}

.categories {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 8px;
}

.category {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  transition: var(--crm-transition);

  &:hover {
    border-color: var(--crm-border-hover);
    background: var(--crm-bg-overlay);
  }

  &__icon {
    width: 28px;
    height: 28px;
    border-radius: var(--crm-radius-sm);
    background: var(--crm-accent-dim);
    color: var(--crm-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__amount {
    font-size: var(--crm-text-sm);
    font-weight: 600;
    color: var(--crm-danger);
    white-space: nowrap;
  }
}

// ── Состояния ───────────────────────────────────────────────────────
.finance-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--crm-text-muted);
  font-size: var(--crm-text-sm);

  p {
    margin: 0;
    color: var(--crm-text-muted);
  }
}

// ── Футер ───────────────────────────────────────────────────────────
.finance-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-sm);
    padding: 5px 8px;
    outline: none;
    transition: var(--crm-transition);

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }
  }

  &__sep {
    color: var(--crm-text-muted);
    font-size: var(--crm-text-sm);
  }
}

// ── Кнопки (локальные) ──────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }

  &--xs {
    padding: 3px 8px;
    font-size: var(--crm-text-xs);
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

    &:hover {
      background: rgba(0, 195, 245, 0.25);
    }
  }
}
</style>