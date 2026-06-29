<!-- app\components\pages\cabinet\DailyWork\ObjectSplitRow.vue -->
<template>
  <div class="split-row">
    <div class="split-row__info">
      <div class="split-row__dot" :style="dotStyle" />
      <span class="split-row__name" :title="objectName">{{ objectName }}</span>
    </div>

    <div class="split-row__control">
      <PercentInput
        :value="percentInputValue"
        :secondary-value="secondaryValue"
        :is-single-object="isSingleObject"
        :mode="isMultiWorker ? 'currency' : 'percent'"
        :min="0"
        :max="isMultiWorker ? effectiveRate : 100"
        :step="isMultiWorker ? (dailyRate / 2 || 500) : 10"
        @update:value="handleValueUpdate"
      />

      <button
        v-if="isRemovable"
        type="button"
        class="split-row__remove"
        aria-label="Удалить объект"
        @click="$emit('remove')"
      >
        <i class="material-symbols-light">x</i>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PercentInput from './ui/PercentInput.vue'

const props = withDefaults(defineProps<{
  objectId: number
  objectName: string
  value: number           // Всегда в процентах
  dailyRate: number
  isRemovable?: boolean
  isSingleObject?: boolean
  // ▼ НОВОЕ ▼
  isMultiWorker?: boolean
  effectiveRate?: number
}>(), {
  isRemovable: true,
  isSingleObject: false,
  isMultiWorker: false,
  effectiveRate: 0
})

const emit = defineEmits<{
  'update:value': [value: number]  // Всегда в процентах
  'remove': []
}>()

const HUES = [340, 25, 55, 140, 190, 275, 310, 225] as const

const dotStyle = computed(() => {
  const hue = HUES[props.objectId % HUES.length] ?? HUES[0]
  return { backgroundColor: `hsl(${hue}, 92%, 58%)` }
})

// ▼ НОВОЕ: для мульти-контрагентов конвертируем % в ₽
const percentInputValue = computed(() => {
  if (props.isMultiWorker && props.effectiveRate > 0) {
    return (props.value / 100) * props.effectiveRate
  }
  return props.value
})

// Вторичное значение:
// Для currency-режима — это % (number)
// Для percent-режима — это сумма (number)
const secondaryValue = computed(() => {
  if (props.isMultiWorker) {
    return props.value  // показываем проценты
  }
  return (props.dailyRate * props.value) / 100
})

// ▼ НОВОЕ: обработчик для currency-режима
function handleValueUpdate(newValue: number) {
  if (props.isMultiWorker && props.effectiveRate > 0) {
    // Конвертируем ₽ обратно в %
    const newPercent = (newValue / props.effectiveRate) * 100
    emit('update:value', newPercent)
  } else {
    emit('update:value', newValue)
  }
}
</script>

<style lang="scss" scoped>
.split-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  margin-bottom: 8px;
  transition: var(--crm-transition);

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    border-color: var(--crm-border-hover);
    background: var(--crm-bg-elevated);
  }

  &__info {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    min-width: 0; // для работы text-overflow
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
  }

  &__name {
    font-size: var(--crm-text-sm);
    font-weight: 500;
    color: var(--crm-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__control {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  &__remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: 1px solid transparent;
    border-radius: var(--crm-radius-sm);
    color: var(--crm-text-muted);
    cursor: pointer;
    transition: var(--crm-transition);
    
    // Иконка
    span { font-size: 20px; }

    &:hover {
      background: var(--crm-danger-dim);
      color: var(--crm-danger);
      border-color: var(--crm-danger-dim);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>