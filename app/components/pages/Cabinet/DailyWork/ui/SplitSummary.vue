<!-- app\components\pages\cabinet\DailyWork\ui\SplitSummary.vue -->
<template>
  <div :class="['split-summary', finalStatusClass]">
    <div class="split-summary__row">
      <span class="split-summary__label">Распределено:</span>
      <span class="split-summary__value">{{ formatCurrency(effectiveAllocated) }}</span>
    </div>
    <div class="split-summary__row">
      <span class="split-summary__label">{{ daysCount > 1 ? `Итого за ${daysCount} дн.:` : 'Ставка за день:' }}</span>
      <span class="split-summary__value">{{ formatCurrency(effectiveTarget) }}</span>
    </div>
    
    <!-- ЛОГИКА ОТОБРАЖЕНИЯ СООБЩЕНИЯ -->
    <div v-if="statusMessage" class="split-summary__diff">
      {{ statusMessage }}
    </div>
    <div v-else-if="status !== 'ok'" class="split-summary__diff">
      {{ diffText }}
    </div>
    <div v-else class="split-summary__diff split-summary__diff--ok">
      ✓ Все хорошо
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'

const props = withDefaults(defineProps<{
  totalAllocated: number
  dailyRate: number
  /** Количество выбранных дней для масштабирования итогов */
  daysCount?: number
  statusMessage?: string
  statusType?: 'error' | 'warning'
}>(), {
  daysCount: 1,
  statusMessage: '',
  statusType: undefined
})

const { formatCurrency } = useDailyAssignment()

// Масштабируем значения под количество выбранных дней
const effectiveAllocated = computed(() => props.totalAllocated * props.daysCount)
const effectiveTarget = computed(() => props.dailyRate * props.daysCount)

const diff = computed(() => effectiveTarget.value - effectiveAllocated.value)

const status = computed<'ok' | 'under' | 'over'>(() => {
  if (Math.abs(diff.value) < 0.01) return 'ok'
  return diff.value > 0 ? 'under' : 'over'
})

const diffText = computed(() => {
  const absDiff = Math.abs(diff.value)
  if (status.value === 'under') return `Не хватает ${formatCurrency(absDiff)}`
  if (status.value === 'over') return `Излишек ${formatCurrency(absDiff)}`
  return ''
})

const finalStatusClass = computed(() => {
  if (props.statusMessage) {
    return props.statusType === 'warning' ? 'split-summary--warning' : 'split-summary--error'
  }
  return `split-summary--${status.value}`
})
</script>

<style lang="scss" scoped>
.split-summary {
  padding: 12px 14px;
  border-radius: var(--crm-radius-md);
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  font-size: var(--crm-text-sm);
  transition: var(--crm-transition);

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 4px 0;
  }

  &__label {
    color: var(--crm-text-muted);
  }

  &__value {
    color: var(--crm-text-primary);
    font-weight: 600;
    font-family: var(--crm-font-mono);
    letter-spacing: 0.02em;
  }

  &__diff {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--crm-border);
    font-weight: 600;
    text-align: center;
    font-size: var(--crm-text-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  // Состояния
  &--ok {
    border-color: var(--crm-success-border, var(--crm-success-dim));
    background: var(--crm-success-dim);
    .split-summary__diff { color: var(--crm-success); border-top-style: solid; }
  }

  &--under {
    border-color: var(--crm-danger-dim);
    background: var(--crm-danger-dim);
    .split-summary__diff { color: var(--crm-danger); border-top-style: solid; }
  }

  &--over {
    border-color: var(--crm-warning-dim);
    background: var(--crm-warning-dim);
    .split-summary__diff { color: var(--crm-warning); border-top-style: solid; }
  }

  &--warning {
    border-color: var(--crm-warning-dim);
    background: var(--crm-warning-dim);
    .split-summary__diff {
      color: var(--crm-warning);
      font-weight: 600;
      border-top-style: solid;
      border-top-color: var(--crm-warning-dim);
    }
  }
}

.split-summary--error {
  border-color: var(--crm-danger-dim);
  background: var(--crm-danger-dim);
  .split-summary__diff {
    color: var(--crm-danger);
    font-weight: 600;
    border-top-style: solid;
    border-top-color: var(--crm-danger-dim);
  }
}
</style>