<!-- app\components\pages\cabinet\dashboards\admin\index.vue -->
 <template>
  <div class="admin-dashboard">
    <!-- Заголовок страницы -->
    <PagesCabinetUiLayoutPageTitle title="Главная" icon="mdi:view-dashboard-outline" />

    <!-- Контент -->
    <div class="admin-dashboard__content">

      <!-- Профиль пользователя -->
      <div class="profile-card">
        <div class="profile-card__avatar">{{ userInitials }}</div>
        <div class="profile-card__info">
          <div class="profile-card__name">
            {{ data?.user?.name || '—' }}
          </div>
          <div class="profile-card__role">{{ roleLabel }}</div>
        </div>
        <div v-if="contractorData" class="profile-card__balance">
          <span class="profile-card__balance-label">Баланс</span>
          <span class="profile-card__balance-value">{{ formatBalance(contractorData.balance) }} ₽</span>
        </div>
        <button class="profile-card__refresh" @click="refreshData" title="Обновить">
          <Icon name="mdi:refresh" size="16" :class="{ spin: isLoading }" />
        </button>
      </div>

      <!-- Сетка виджетов -->
      <div class="home-grid">
        <PagesCabinetDashboardsAdminFinanceSummaryCard class="home-grid__item" />
        <PagesCabinetDashboardsAdminRecentOperationsCard class="home-grid__item" />
        <PagesCabinetDashboardsAdminObjectStatusCard class="home-grid__item" />
        <PagesCabinetDashboardsAdminContractorFinanceCard class="home-grid__item" />
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from 'stores/auth'
import { navigateTo } from '#app'
import { useApi } from '~/composables/useApi'

const api = useApi()
const data = ref<any>(null)
const contractorData = ref<any>(null)
const isLoading = ref(true)
const authStore = useAuthStore()

const roleLabels: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  foreman: 'Прораб',
  master: 'Мастер',
  worker: 'Рабочий',
}

const contractorTypeMap: Record<string, string> = {
  office: 'office',
  foreman: 'foreman',
  worker: 'worker',
  master: 'master',
}

const userInitials = computed(() => {
  const name = data.value?.user?.name || ''
  return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase() || '?'
})

const roleLabel = computed(() =>
  roleLabels[data.value?.user?.role] || 'Пользователь'
)

const formatBalance = (amount: number) =>
  new Intl.NumberFormat('ru-RU').format(amount || 0)

async function fetchData() {
  isLoading.value = true
  try {
    const response = await api.get<{ user: any }>('/api/me')

    if (!response) return navigateTo('/login')
    data.value = response

    const user = response.user
    if (user.contractorId && user.contractorType) {
      const type = contractorTypeMap[user.contractorType]
      if (type) {
        contractorData.value = await api.get(
          `/api/contractors/${type}/${user.contractorId}`
        )
      }
    }
  } catch (err) {
    console.error('[Главная] Ошибка загрузки данных:', err)
    data.value = null
  } finally {
    isLoading.value = false
  }
}

const refreshData = () => fetchData()

onMounted(fetchData)
</script>

<style lang="scss" scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  &__content {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);

  &__avatar {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);
    font-size: var(--crm-text-md);
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info {
    flex: 1;
    min-width: 0;
  }

  &__name {
    font-size: var(--crm-text-md);
    font-weight: 600;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__role {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-muted);
    margin-top: 1px;
  }

  &__balance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 1px;
    flex-shrink: 0;
  }

  &__balance-label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }

  &__balance-value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    color: var(--crm-success);
  }

  &__refresh {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-muted);
    cursor: pointer;
    flex-shrink: 0;
    transition: var(--crm-transition);

    &:hover {
      background: var(--crm-bg-elevated);
      border-color: var(--crm-border-hover);
      color: var(--crm-text-primary);
    }
  }
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  &__item {
    min-width: 0;

    &--wide {
      grid-column: span 2;
    }
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;

    &__item--wide {
      grid-column: span 1;
    }
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

@media (max-width: 767.98px) {
  .admin-dashboard__content {
    padding: 16px;
  }
}
</style>