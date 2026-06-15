<!-- app/components/pages/cabinet/Contractors/ContractorOperations/AdditionalSection.vue -->
<template>
  <div class="operations-section operations-section--additional">

    <!-- Заголовок секции -->
    <div class="operations-section__header">
      <h4 class="operations-section__title">
        <Icon name="mdi:wallet-giftcard" size="16" />
        Выплаты (не влияют на баланс)
      </h4>
      <span class="operations-section__count">{{ operations.length }}</span>
    </div>

    <!-- Пустое состояние -->
    <div v-if="operations.length === 0" class="operations-section__empty">
      <Icon name="mdi:information-outline" size="24" />
      <span>Нет дополнительных выплат</span>
    </div>

    <!-- Список операций -->
    <div v-else class="operations-list">
      <div
        v-for="operation in operations"
        :key="`additional-${operation.id}`"
        class="operation-item operation-item--additional"
      >
        <!-- Левая часть: иконка + инфо -->
        <div class="operation-item__left">
          <div class="operation-icon operation-icon--additional">
            <Icon :name="getIcon(operation.expenseType)" size="16" />
          </div>
          <div class="operation-info">
            <div class="operation-info__title">
              {{ operation.expenseType || 'Выплата' }}
            </div>
            <div class="operation-info__meta">
              <span class="operation-info__date">{{ formatDate(operation.date) }}</span>

              <!-- Объект (без ссылки — доп. выплаты не всегда привязаны к активным объектам) -->
              <span v-if="operation.object" class="operation-info__object">
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
          <span class="operation-amount operation-amount--additional">
            {{ formatCurrency(operation.amount) }}
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
      <div class="operations-summary operations-summary--additional">
        <div class="summary-item">
          <span class="summary-item__label">Зарплата</span>
          <span class="summary-item__value">{{ formatCurrency(totals.salary) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">Топливо</span>
          <span class="summary-item__value">{{ formatCurrency(totals.fuel) }}</span>
        </div>
        <div class="summary-item">
          <span class="summary-item__label">Всего доп.</span>
          <span class="summary-item__value summary-item__value--additional">
            {{ formatCurrency(totals.additional) }}
          </span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
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
  salary: number
  fuel: number
  additional: number
}

// ── Props ────────────────────────────────────────────────────────────
defineProps<{
  operations: Operation[]
  totals: Totals
  deletingId: number | null
  formatCurrency: (amount: number) => string
  formatDate: (date: string) => string
}>()

// ── Emits ────────────────────────────────────────────────────────────
defineEmits<{
  'edit': [operation: Operation]
  'delete': [operation: Operation]
}>()

// ── Иконки по типу расхода ───────────────────────────────────────────
function getIcon(expenseType?: string): string {
  switch (expenseType) {
    case 'Зарплата': return 'mdi:cash-multiple'
    case 'Топливо': return 'mdi:gas-station'
    case 'Налог': return 'mdi:bank-outline'
    case 'Реклама': return 'mdi:megaphone-outline'
    case 'Кредит': return 'mdi:credit-card-outline'
    case 'ГлавПрофи': return 'mdi:domain'
    default: return 'mdi:cash'
  }
}
</script>

<style lang="scss" scoped>
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
    gap: 8px;
    flex-wrap: wrap;
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

  &--additional {
    color: var(--crm-accent);
  }
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

    &--additional {
      color: var(--crm-accent);
    }
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