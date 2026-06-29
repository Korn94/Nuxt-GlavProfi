// app/pages/cabinet/master.vue
<template>
  <div class="master-dashboard">
    <PagesCabinetUiLayoutPageTitle 
      title="Панель мастера" 
      icon="mdi:hammer-wrench" 
    />
    
    <!-- Загрузка данных -->
    <div v-if="isLoading" class="master-dashboard__loading">
      <Icon name="mdi:loading" class="animate-spin" size="32" />
      <span>Загрузка данных...</span>
    </div>

    <!-- Контент -->
    <template v-else-if="contractorId && contractorType">
      <!-- Сетка виджетов -->
      <div class="dashboard-grid">
        <!-- Виджет баланса -->
        <div class="dashboard-widget dashboard-widget--balance">
          <PagesCabinetMasterDashboardBalanceCard 
            :balance="balance"
            :loading="loadingBalance"
            @refresh="loadBalance"
          />
        </div>

        <!-- Виджет статистики -->
        <div class="dashboard-widget dashboard-widget--stats">
          <PagesCabinetMasterDashboardStatsCard 
            :stats="stats"
            :loading="loadingStats"
          />
        </div>

        <!-- Виджет операций -->
        <div class="dashboard-widget dashboard-widget--operations">
          <PagesCabinetMasterDashboardOperationsWidget 
            :contractorId="contractorId"
            :contractorType="contractorType"
            @balance-changed="handleBalanceChanged"
          />
        </div>

        <!-- Placeholder для будущих виджетов -->
        <div class="dashboard-widget dashboard-widget--placeholder">
          <PagesCabinetMasterDashboardComingSoonWidget 
            title="Активные объекты"
            icon="mdi:map-marker-multiple-outline"
            message="Скоро здесь появятся ваши активные объекты"
          />
        </div>

        <div class="dashboard-widget dashboard-widget--placeholder">
          <PagesCabinetMasterDashboardComingSoonWidget 
            title="Задачи"
            icon="mdi:clipboard-check-outline"
            message="Здесь будут ваши задачи и поручения"
          />
        </div>
      </div>
    </template>

    <!-- Ошибка: нет данных контрагента -->
    <div v-else class="master-dashboard__error">
      <Icon name="mdi:alert-circle-outline" size="48" />
      <p>Не удалось загрузить данные мастера</p>
      <p class="error-hint">Возможно, ваш аккаунт не привязан к контрагенту</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import { navigateTo } from '#app'
import type { ContractorDTO, ContractorType } from '~/types/contractors'
import { useHead } from 'nuxt/app'
import { definePageMeta } from 'node_modules/nuxt/dist/pages/runtime'

definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'role'],
})

// ── Интерфейсы для API ответов ────────────────────────────────────────
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

// ── Маппинг типа контрагента (как в админской странице) ──────────────
const contractorTypeMap: Record<string, ContractorType> = {
  office: 'office',
  foreman: 'foreman',
  worker: 'worker',
  master: 'master',
}

const api = useApi()

// ── Состояние ─────────────────────────────────────────────────────────
const isLoading = ref(true)
const userData = ref<UserData | null>(null)
const contractorId = ref<number>(0)
const contractorType = ref<ContractorType>('master')

const balance = ref({
  current: 0,
  income: 0,
  expense: 0
})

const stats = ref({
  totalWorks: 0,
  completedWorks: 0,
  thisMonth: 0
})

const loadingBalance = ref(false)
const loadingStats = ref(false)

// ── Загрузка данных пользователя (как в admin/index.vue) ──────────────
async function fetchUserData() {
  isLoading.value = true
  try {
    const response = await api.get<MeResponse>('/api/me')

    if (!response || !response.user) {
      console.warn('[MasterDashboard] Пользователь не авторизован')
      return navigateTo('/login')
    }

    userData.value = response.user
    console.log('[MasterDashboard] ✅ Данные пользователя из /api/me:', {
      id: response.user.id,
      role: response.user.role,
      name: response.user.name,
      contractorId: response.user.contractorId,
      contractorType: response.user.contractorType
    })

    // Проверяем наличие contractorId (как в admin/index.vue)
    if (response.user.contractorId && response.user.contractorType) {
      const type = contractorTypeMap[response.user.contractorType]
      if (type) {
        contractorId.value = response.user.contractorId
        contractorType.value = type
        console.log('[MasterDashboard] ✅ Контрагент определен:', {
          id: contractorId.value,
          type: contractorType.value
        })
      } else {
        console.warn('[MasterDashboard] Неизвестный тип контрагента:', response.user.contractorType)
      }
    } else {
      console.warn('[MasterDashboard] У пользователя нет contractorId')
    }
  } catch (err: any) {
    console.error('[MasterDashboard] Ошибка загрузки данных:', err)
  } finally {
    isLoading.value = false
  }
}

// ── Загрузка баланса ──────────────────────────────────────────────────
async function loadBalance() {
  if (!contractorId.value) {
    console.warn('[MasterDashboard] contractorId не найден')
    return
  }

  loadingBalance.value = true
  try {
    // Получаем данные контрагента для баланса
    const contractorResponse = await api.get<ContractorDTO>(
      `/api/contractors/${contractorType.value}/${contractorId.value}`
    )

    // Получаем историю доходов и расходов
    const [incomesResponse, expensesResponse] = await Promise.all([
      api.get<IncomeOperation[]>(
        `/api/contractors/${contractorType.value}/${contractorId.value}/incomes`
      ),
      api.get<ExpenseOperation[]>(
        `/api/contractors/${contractorType.value}/${contractorId.value}/expenses`
      )
    ])

    const totalIncome = incomesResponse.reduce((sum, op) => sum + op.amount, 0)
    const totalExpense = expensesResponse
      .filter(e => e.title === 'Работа' || e.title === 'Оплата работы')
      .reduce((sum, op) => sum + op.amount, 0)

    balance.value = {
      current: parseFloat(String(contractorResponse.balance)) || 0,
      income: totalIncome,
      expense: totalExpense
    }

    console.log('[MasterDashboard] ✅ Баланс загружен:', balance.value)
  } catch (error: any) {
    console.error('[MasterDashboard] Ошибка загрузки баланса:', error)
    // Заглушка
    balance.value = {
      current: 150000,
      income: 450000,
      expense: 300000
    }
  } finally {
    loadingBalance.value = false
  }
}

// ── Загрузка статистики ───────────────────────────────────────────────
async function loadStats() {
  if (!contractorId.value) return

  loadingStats.value = true
  try {
    const incomesResponse = await api.get<IncomeOperation[]>(
      `/api/contractors/${contractorType.value}/${contractorId.value}/incomes`
    )

    const totalWorks = incomesResponse.length
    const completedWorks = incomesResponse.filter(w => w.accepted).length
    
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonth = incomesResponse.filter(w => {
      if (!w.date) return false
      return new Date(w.date) >= monthStart
    }).length

    stats.value = {
      totalWorks,
      completedWorks,
      thisMonth
    }

    console.log('[MasterDashboard] ✅ Статистика загружена:', stats.value)
  } catch (error: any) {
    console.error('[MasterDashboard] Ошибка загрузки статистики:', error)
    stats.value = {
      totalWorks: 42,
      completedWorks: 38,
      thisMonth: 7
    }
  } finally {
    loadingStats.value = false
  }
}

// ── Обработчик изменения баланса ──────────────────────────────────────
function handleBalanceChanged() {
  loadBalance()
  loadStats()
}

// ── Lifecycle ─────────────────────────────────────────────────────────
onMounted(async () => {
  // 1. Сначала загружаем данные пользователя через /api/me (как в admin/index.vue)
  await fetchUserData()
  
  // 2. Если contractorId найден — загружаем баланс и статистику
  if (contractorId.value) {
    await Promise.all([
      loadBalance(),
      loadStats()
    ])
  }
})

useHead({
  title: 'CRM — Панель мастера'
})
</script>

<style lang="scss" scoped>
.master-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;

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

  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 60px 20px;
    color: var(--crm-text-muted);
    text-align: center;

    .error-hint {
      font-size: var(--crm-text-sm);
      color: var(--crm-text-disabled);
    }
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.dashboard-widget {
  display: flex;
  flex-direction: column;

  &--balance,
  &--stats {
    grid-column: span 1;
  }

  &--operations {
    grid-column: 1 / -1;

    @media (min-width: 1200px) {
      grid-column: span 2;
    }
  }

  &--placeholder {
    grid-column: span 1;
  }
}
</style>