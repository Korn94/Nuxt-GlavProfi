<!-- app/components/pages/cabinet/dashboards/master/index.vue -->
<template>
  <div class="master-dashboard">
    <!-- Персонализированный заголовок -->
    <PagesCabinetUiLayoutPageTitle 
      :title="greetingTitle" 
      icon="mdi:hammer-wrench"
    >
    </PagesCabinetUiLayoutPageTitle>

    <!-- Состояние: Загрузка -->
    <div v-if="isLoading" class="master-dashboard__loading">
      <Icon name="mdi:loading" class="animate-spin" size="32" />
      <span>Загрузка данных...</span>
    </div>

    <!-- Состояние: Контент (если есть contractorId) -->
    <template v-else-if="contractorId && contractorType">
      <div class="dashboard-grid">
        <!-- Строка 1: Баланс + Статистика -->
        <div class="dashboard-widget dashboard-widget--balance">
          <PagesCabinetDashboardsMasterBalanceCard 
            :balance="balance" 
            :loading="loadingBalance"
            @refresh="loadBalance" 
          />
        </div>

        <div class="dashboard-widget dashboard-widget--stats">
          <PagesCabinetDashboardsMasterStatsCard 
            :stats="stats" 
            :loading="loadingStats" 
          />
        </div>

        <!-- Строка 2: График подневки (только если есть данные) -->
        <div v-if="hasDailyData" class="dashboard-widget dashboard-widget--daily-schedule">
          <PagesCabinetDashboardsMasterDailyScheduleCard />
        </div>

        <!-- Строка 3: Операции -->
        <div class="dashboard-widget dashboard-widget--operations">
          <PagesCabinetDashboardsMasterOperationsWidget 
            :contractorId="contractorId" 
            :contractorType="contractorType"
            @balance-changed="handleBalanceChanged" 
          />
        </div>

        <!-- Строка 4: Placeholder -->
        <div class="dashboard-widget dashboard-widget--placeholder">
          <PagesCabinetDashboardsMasterComingSoonWidget 
            title="Активные объекты" 
            icon="mdi:map-marker-multiple-outline"
            message="Скоро здесь появятся ваши активные объекты" 
          />
        </div>
      </div>
    </template>

    <!-- Состояние: Ошибка (если нет contractorId) -->
    <div v-else class="master-dashboard__error">
      <Icon name="mdi:alert-circle-outline" size="48" />
      <p class="master-dashboard__error-title">Не удалось загрузить данные мастера</p>
      <p class="master-dashboard__error-hint">Возможно, ваш аккаунт не привязан к контрагенту</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { navigateTo } from '#app'
import type { ContractorDTO, ContractorType } from '~/types/contractors'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'
import { useHead } from 'nuxt/app'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
})

// ── Интерфейсы ───────────────────────────────────────────────────────
interface UserData {
  id: number
  login: string
  role: string
  name: string
  contractorId?: number
  contractorType?: ContractorType
}

interface MeResponse {
  user: UserData | null
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

interface MonthStats {
  month: string
  monthName: string
  year: number
  days: number
}

// ── Константы ────────────────────────────────────────────────────────
const contractorTypeMap: Record<string, ContractorType> = {
  office: 'office',
  foreman: 'foreman',
  worker: 'worker',
  master: 'master',
}

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий'
}

// ── Инициализация ────────────────────────────────────────────────────
const api = useApi()

// ── Состояние ────────────────────────────────────────────────────────
const isLoading = ref(true)
const userData = ref<UserData | null>(null)
const contractorId = ref<number>(0)
const contractorType = ref<ContractorType>('master')
const hasDailyData = ref(false)

const balance = ref({
  current: 0,
  income: 0,
  expense: 0
})

const stats = ref<MonthStats[]>([])

const loadingBalance = ref(false)
const loadingStats = ref(false)

// ── Персонализация заголовка ─────────────────────────────────────────
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Доброе утро'
  if (hour >= 12 && hour < 18) return 'Добрый день'
  if (hour >= 18 && hour < 23) return 'Добрый вечер'
  return 'Доброй ночи'
}

const greetingTitle = computed(() => {
  const greeting = getTimeOfDay()
  const name = userData.value?.name || 'Мастер'
  return `${greeting}, ${name}!`
})

const roleLabel = computed(() => {
  const role = userData.value?.role || 'master'
  return roleLabels[role] || 'Мастер'
})

// ── Загрузка данных пользователя ─────────────────────────────────────
async function fetchUserData() {
  try {
    const response = await api.get<MeResponse>('/api/me')

    if (!response || !response.user) {
      console.warn('[MasterDashboard] Пользователь не авторизован')
      return navigateTo('/login')
    }

    userData.value = response.user
    console.log('[MasterDashboard] ✅ Данные пользователя:', {
      id: response.user.id,
      name: response.user.name,
      role: response.user.role,
      contractorId: response.user.contractorId,
      contractorType: response.user.contractorType
    })

    if (response.user.contractorId && response.user.contractorType) {
      const type = contractorTypeMap[response.user.contractorType]
      if (type) {
        contractorId.value = response.user.contractorId
        contractorType.value = type
      } else {
        console.warn('[MasterDashboard] Неизвестный тип контрагента:', response.user.contractorType)
      }
    } else {
      console.warn('[MasterDashboard] У пользователя нет contractorId')
    }
  } catch (err: any) {
    console.error('[MasterDashboard] Ошибка загрузки данных:', err)
  }
}

// ── Загрузка баланса ─────────────────────────────────────────────────
async function loadBalance() {
  if (!contractorId.value) return

  loadingBalance.value = true
  try {
    const contractorResponse = await api.get<ContractorDTO>(
      `/api/contractors/${contractorType.value}/${contractorId.value}`
    )

    const [incomesResponse, expensesResponse] = await Promise.all([
      api.get<IncomeOperation[]>(
        `/api/contractors/${contractorType.value}/${contractorId.value}/incomes`
      ),
      api.get<ExpenseOperation[]>(
        `/api/contractors/${contractorType.value}/${contractorId.value}/expenses`
      )
    ])

    const totalIncome = incomesResponse.reduce((sum, op) => sum + op.amount, 0)
    
    // ✅ Фильтр по значению из БД — 'Работа' (не 'Оплачено'!)
    // В UI оно отображается как "Оплачено" через getDisplayTitle() в OperationsWidget
    const totalExpense = expensesResponse
      .filter(e => e.title === 'Работа')
      .reduce((sum, op) => sum + op.amount, 0)

    balance.value = {
      current: parseFloat(String(contractorResponse.balance)) || 0,
      income: totalIncome,
      expense: totalExpense
    }

    console.log('[MasterDashboard] ✅ Баланс загружен:', balance.value)
  } catch (error: any) {
    console.error('[MasterDashboard] Ошибка загрузки баланса:', error)
  } finally {
    loadingBalance.value = false
  }
}

// ── Загрузка статистики подневки ─────────────────────────────────────
async function loadStats() {
  if (!contractorId.value) return

  loadingStats.value = true
  try {
    const response = await api.get<MonthStats[]>(
      `/api/contractors/${contractorType.value}/${contractorId.value}/daily-stats`
    )
    stats.value = response
  } catch (error: any) {
    console.error('[MasterDashboard] Ошибка загрузки статистики:', error)
    stats.value = []
  } finally {
    loadingStats.value = false
  }
}

// ── Проверка наличия данных подневки за 14 дней ──────────────────────
async function checkDailyData() {
  if (!contractorId.value) return

  try {
    const response = await api.get<{ hasData: boolean }>('/api/contractors/me/daily-recent')
    hasDailyData.value = response.hasData
  } catch (err: any) {
    console.error('[MasterDashboard] Ошибка проверки данных подневки:', err)
    hasDailyData.value = false
  }
}

// ── Обработчик изменения баланса ─────────────────────────────────────
function handleBalanceChanged() {
  loadBalance()
  loadStats()
  checkDailyData()
}

// ── Lifecycle ────────────────────────────────────────────────────────
onMounted(async () => {
  // 1. Сначала получаем данные пользователя (включая contractorId)
  await fetchUserData()

  // 2. Если contractorId найден — загружаем все виджеты параллельно
  if (contractorId.value) {
    await Promise.all([
      loadBalance(),
      loadStats(),
      checkDailyData()
    ])
  }

  // 3. Снимаем флаг загрузки после всех запросов
  isLoading.value = false
})

useHead({
  title: 'CRM — Панель мастера'
})
</script>

<style lang="scss" scoped>
.master-dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--crm-bg-base);

  // ── Персонализированный бейдж роли ─────────────────────────────────
  :deep(.greeting-subtitle) {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    border-radius: var(--crm-radius-md);
    font-size: var(--crm-text-xs);
    font-weight: 600;
    color: var(--crm-accent);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    line-height: 1;
  }

  // ── Состояние загрузки ─────────────────────────────────────────────
  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 60px 20px;
    color: var(--crm-text-muted);
    font-size: var(--crm-text-md);
  }

  // ── Состояние ошибки ───────────────────────────────────────────────
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px;
    color: var(--crm-text-muted);
    text-align: center;

    &-title {
      font-size: var(--crm-text-lg);
      font-weight: 600;
      color: var(--crm-text-primary);
      margin: 0;
    }

    &-hint {
      font-size: var(--crm-text-sm);
      color: var(--crm-text-disabled);
      margin: 0;
    }
  }
}

// ── Спиннер ──────────────────────────────────────────────────────────
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// ── Сетка виджетов ───────────────────────────────────────────────────
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;

  @media (max-width: 1024px) {
    gap: 16px;
    padding: 16px;
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 16px;
    gap: 14px;
  }
}

.dashboard-widget {
  display: flex;
  flex-direction: column;
  min-width: 0;

  // Строка 1: Баланс (колонка 1) + Статистика (колонка 2)
  &--balance,
  &--stats {
    grid-column: span 1;
  }

  // Строка 2-4: широкие блоки (занимают обе колонки)
  &--daily-schedule,
  &--operations,
  &--placeholder {
    grid-column: 1 / -1;
  }

  @media (max-width: 768px) {
    // На мобильных все блоки на всю ширину
    &--balance,
    &--stats {
      grid-column: span 1;
    }
  }
}
</style>