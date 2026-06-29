<!-- app\components\pages\cabinet\dashboards\master\BalanceCard.vue -->
 <template>
  <div class="balance-card">
    <!-- Заголовок -->
    <div class="balance-card__header">
      <div class="balance-card__title">
        <Icon name="mdi:wallet-outline" size="20" />
        <span>Мой баланс</span>
      </div>
      <button 
        class="balance-card__refresh"
        @click="$emit('refresh')"
        :disabled="loading"
        title="Обновить"
      >
        <Icon 
          name="mdi:refresh" 
          size="18" 
          :class="{ spin: loading }"
        />
      </button>
    </div>

    <!-- Основной баланс -->
    <div class="balance-card__main">
      <div v-if="loading" class="balance-card__skeleton">
        <div class="skel skel--amount" />
        <div class="skel skel--label" />
      </div>
      <div v-else class="balance-card__amount">
        <span :class="['balance-value', getBalanceClass(balance.current)]">
          {{ formatCurrency(balance.current) }}
        </span>
        <span class="balance-label">Текущий баланс</span>
      </div>
    </div>

    <!-- Статистика -->
    <div class="balance-card__stats">
      <div class="stat-item stat-item--income">
        <Icon name="mdi:trending-up" size="16" />
        <div class="stat-item__content">
          <span class="stat-item__value">+{{ formatCurrency(balance.income) }}</span>
          <span class="stat-item__label">Выполнено</span>
        </div>
      </div>
      <div class="stat-item stat-item--expense">
        <Icon name="mdi:trending-down" size="16" />
        <div class="stat-item__content">
          <span class="stat-item__value">−{{ formatCurrency(balance.expense) }}</span>
          <span class="stat-item__label">Оплачено</span>
        </div>
      </div>
    </div>

    <!-- Визуализация -->
    <div class="balance-card__visualization">
      <div class="balance-bar">
        <div 
          class="balance-bar__income"
          :style="{ width: getIncomePercent() + '%' }"
        />
        <div 
          class="balance-bar__expense"
          :style="{ width: getExpensePercent() + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue';

interface Balance {
  current: number
  income: number
  expense: number
}

defineProps<{
  balance: Balance
  loading?: boolean
}>()

defineEmits<{
  'refresh': []
}>()

function formatCurrency(amount: number): string {
  return Math.abs(amount).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  })
}

function getBalanceClass(balance: number): string {
  if (balance > 0) return 'balance-value--positive'
  if (balance < 0) return 'balance-value--negative'
  return 'balance-value--neutral'
}

function getIncomePercent(): number {
  const props = getCurrentInstance()?.props as any
  if (!props) return 0
  const total = props.balance.income + props.balance.expense
  if (total === 0) return 50
  return (props.balance.income / total) * 100
}

function getExpensePercent(): number {
  const props = getCurrentInstance()?.props as any
  if (!props) return 0
  const total = props.balance.income + props.balance.expense
  if (total === 0) return 50
  return (props.balance.expense / total) * 100
}
</script>

<style lang="scss" scoped>
.balance-card {
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-lg);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.balance-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.balance-card__title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--crm-text-lg);
  font-weight: 600;
  color: var(--crm-text-primary);
}

.balance-card__refresh {
  background: none;
  border: none;
  color: var(--crm-text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: var(--crm-radius-md);
  transition: var(--crm-transition);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--crm-bg-elevated);
    color: var(--crm-accent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.balance-card__main {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.balance-card__skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .skel {
    border-radius: var(--crm-radius-md);
    background: linear-gradient(90deg,
        var(--crm-bg-elevated) 25%,
        var(--crm-bg-overlay) 50%,
        var(--crm-bg-elevated) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;

    &--amount {
      height: 48px;
      width: 200px;
    }

    &--label {
      height: 16px;
      width: 120px;
    }
  }
}

.balance-card__amount {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.balance-value {
  font-size: 32px;
  font-weight: 700;
  font-family: var(--crm-font-mono);

  &--positive { color: var(--crm-success); }
  &--negative { color: var(--crm-danger); }
  &--neutral { color: var(--crm-text-primary); }
}

.balance-label {
  font-size: var(--crm-text-sm);
  color: var(--crm-text-muted);
}

.balance-card__stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-md);
  border: 1px solid var(--crm-border);

  &--income {
    color: var(--crm-success);
    border-color: rgba(61, 214, 140, 0.2);
  }

  &--expense {
    color: var(--crm-danger);
    border-color: rgba(242, 95, 92, 0.2);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__value {
    font-size: var(--crm-text-md);
    font-weight: 700;
    font-family: var(--crm-font-mono);
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
  }
}

.balance-card__visualization {
  margin-top: auto;
}

.balance-bar {
  display: flex;
  height: 8px;
  background: var(--crm-bg-elevated);
  border-radius: var(--crm-radius-sm);
  overflow: hidden;

  &__income {
    background: var(--crm-success);
    transition: width 0.3s ease;
  }

  &__expense {
    background: var(--crm-danger);
    transition: width 0.3s ease;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (max-width: 768px) {
  .balance-card__stats {
    grid-template-columns: 1fr;
  }

  .balance-value {
    font-size: 28px;
  }
}
</style>