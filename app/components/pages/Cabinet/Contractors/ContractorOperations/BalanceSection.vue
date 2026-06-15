<!-- app/components/pages/cabinet/Contractors/ContractorOperations/BalanceSection.vue -->
<template>
  <div class="operations-section">

    <!-- Заголовок секции -->
    <div class="operations-section__header">
      <h4 class="operations-section__title">
        <Icon name="mdi:handshake" size="16" />
        Взаиморасчёты (влияет на баланс)
      </h4>
      <div class="operations-section__filters">
        <select v-model="localBalanceFilter" class="filter-select filter-select--sm">
          <option value="all">Все типы</option>
          <option value="payment">Оплата</option>
          <option value="accepted">Работа принята</option>
        </select>
      </div>
      <span class="operations-section__count">{{ operations.length }}</span>
    </div>

    <!-- Пустое состояние -->
    <div v-if="operations.length === 0" class="operations-section__empty">
      <Icon name="mdi:check-circle-outline" size="24" />
      <span>Нет операций по работам</span>
    </div>

    <!-- Список операций -->
    <div v-else class="operations-list">
      <div
        v-for="operation in operations"
        :key="`balance-${operation.id}`"
        :class="['operation-item', `operation-item--${operation.type}`]"
      >
        <!-- Левая часть: иконка + инфо -->
        <div class="operation-item__left">
          <div :class="['operation-icon', `operation-icon--${operation.type}`]">
            <Icon :name="operation.type === 'expense' ? 'mdi:minus' : 'mdi:plus'" size="16" />
          </div>
          <div class="operation-info">
            <div class="operation-info__title">{{ operation.title }}</div>
            <div class="operation-info__meta">
              <span class="operation-info__date">{{ formatDate(operation.date) }}</span>

              <!-- Объект со ссылкой (если есть ID) -->
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

              <!-- Объект без ссылки -->
              <span v-else-if="operation.object" class="operation-info__object">
                <Icon name="mdi:map-marker-outline" size="12" />
                {{ operation.object }}
              </span>

              <!-- Комментарий -->
              <span v-if="operation.comment" class="operation-info__comment">
                <Icon name="mdi:comment-outline" size="12" />
                {{ operation.comment }}
              </span>
            </div>
          </div>
        </div>

        <!-- Правая часть: сумма + действия -->
        <div class="operation-item__right">
          <span :class="['operation-amount', `operation-amount--${operation.type}`]">
            {{ operation.type === 'expense' ? '−' : '+' }}{{ formatCurrency(operation.amount) }}
          </span>

          <div class="operation-actions">
            <button
              class="operation-btn operation-btn--edit"
              @click="$emit('edit', operation)"
              title="Редактировать"
            >
              <Icon name="mdi:pencil-outline" size="16" />
            </button>
            <button
              class="operation-btn operation-btn--delete"
              @click="$emit('delete', operation)"
              :disabled="deletingId === operation.id"
              title="Удалить"
            >
              <Icon
                :name="deletingId === operation.id ? 'mdi:loading' : 'mdi:trash-can-outline'"
                size="16"
                :class="{ spin: deletingId === operation.id }"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Итоги секции -->
    <div v-if="operations.length > 0" class="operations-section__footer">
      <div class="operations-summary">
        <div class="summary-item">
          <span class="summary-item__label">Расходы (Оплата)</span>
          <span class="summary-item__value summary-item__value--expense">
            −{{ formatCurrency(totals.expenses) }}
          </span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">Приходы (Работы)</span>
          <span class="summary-item__value summary-item__value--income">
            +{{ formatCurrency(totals.incomes) }}
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
import { computed } from 'vue'

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
}

interface Totals {
  expenses: number
  incomes: number
  net: number
}

// ── Props ────────────────────────────────────────────────────────────
const props = defineProps<{
  operations: Operation[]
  balanceFilter: 'all' | 'payment' | 'accepted'
  totals: Totals
  deletingId: number | null
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
  getNetClass: () => string
}>()

// ── Emits ────────────────────────────────────────────────────────────
const emit = defineEmits<{
  'edit': [operation: Operation]
  'delete': [operation: Operation]
  'update:balanceFilter': [value: 'all' | 'payment' | 'accepted']
}>()

// ── Двусторонняя привязка для balanceFilter ──────────────────────────
const localBalanceFilter = computed({
  get: () => props.balanceFilter,
  set: (value) => emit('update:balanceFilter', value)
})
</script>

<style lang="scss" scoped>
.operations-section {
  border-top: 1px solid var(--crm-border);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--crm-bg-overlay);
    border-bottom: 1px solid var(--crm-border);
    gap: 8px;
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    align-items: center;
    gap: 8px;
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

  &:last-child { border-bottom: none; }
  &:hover { background: var(--crm-bg-overlay); }

  &--expense { border-left: 3px solid var(--crm-danger); }
  &--income { border-left: 3px solid var(--crm-success); }
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

  &--expense { background: var(--crm-danger-dim); color: var(--crm-danger); }
  &--income { background: var(--crm-success-dim); color: var(--crm-success); }
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

  &__date { font-size: var(--crm-text-xs); color: var(--crm-text-muted); }

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
    .link-icon { transform: translateX(2px); }
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

  &:not(.operation-info__link) { opacity: 0.9; }
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

  &--expense { color: var(--crm-danger); }
  &--income { color: var(--crm-success); }
}

.operation-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.operation-item:hover .operation-actions {
  opacity: 1;
}

.operation-btn {
  background: none;
  border: none;
  color: var(--crm-text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  transition: var(--crm-transition);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--crm-bg-overlay);
    color: var(--crm-text-primary);
  }

  &--edit:hover {
    color: var(--crm-accent);
    background: var(--crm-accent-dim);
  }

  &--delete:hover {
    color: var(--crm-danger);
    background: var(--crm-danger-dim);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.operations-summary {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
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

    &--positive { color: var(--crm-success); }
    &--negative { color: var(--crm-danger); }
    &--neutral { color: var(--crm-text-primary); }
    &--expense { color: var(--crm-danger); }
    &--income { color: var(--crm-success); }
  }
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

  &--sm {
    padding: 3px 6px;
    font-size: var(--crm-text-xxs);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .operation-item { padding: 10px 12px; }
  .operations-section__footer { padding: 10px 12px; }
  .operations-summary { gap: 12px; }
  .operation-actions { opacity: 1; }
}
</style>