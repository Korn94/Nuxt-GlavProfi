<!-- app\components\pages\cabinet\DailyWork\ui\CalendarCell.vue -->
<template>
  <div
    :class="{
      'daily-cell': true,
      'daily-cell--locked': !isEditable,
      'daily-cell--selected': isSelected,
      'daily-cell--range-start': rangeType === 'start',
      'daily-cell--range-middle': rangeType === 'middle',
      'daily-cell--range-end': rangeType === 'end'
    }"
    :data-date="date"
    v-on="cellEvents"
  >
    <div v-if="assignments.length === 0" class="daily-cell__placeholder" />
    <div v-else class="daily-cell__indicator-wrapper">
      <div
        class="daily-cell__indicator"
        :class="{ 'daily-cell__indicator--half': isHalfDay }"
        :style="indicatorStyle"
      />
      <!-- Бейдж количества людей -->
      <span v-if="displayMultiplier" class="daily-cell__multiplier">
        ×{{ displayMultiplier }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DailyAssignment } from '~/types/daily-assignments'

const props = defineProps<{
  date: string
  workerId: number
  dailyRate: number  // ← НОВОЕ: для расчёта workerCount
  assignments: DailyAssignment[]
  isEditable: boolean
  isSelected: boolean
  rangeType?: 'start' | 'middle' | 'end'
}>()

const emit = defineEmits<{
  click: []
  mousedown: [event: MouseEvent]
  mouseenter: []
  touchstart: [event: TouchEvent]
  touchmove: [event: TouchEvent]
}>()

const HUES = [340, 25, 55, 140, 190, 275, 310, 225] as const

function getObjectColor(objectId: number): string {
  const hue = HUES[objectId % HUES.length] ?? HUES[0]
  return `hsl(${hue}, 92%, 58%)`
}

/** Суммарная сумма за день */
const totalAmount = computed(() =>
  props.assignments.reduce((sum, a) => sum + a.amount, 0)
)

/** Количество людей (мульти-контрагент).
 *  Рассчитывается как totalAmount / dailyRate.
 *  Если workerCount > 1 — показываем бейдж ×N */
const workerCount = computed(() => {
  if (!props.dailyRate || props.dailyRate <= 0) return 1
  return Math.round(totalAmount.value / props.dailyRate)
})

/** Количество людей для отображения (только если > 1) */
const displayMultiplier = computed(() =>
  workerCount.value > 1 ? workerCount.value : null
)

/** Определяем "пол дня" по сумме процентов ≈ 50.
 *  Работает только когда нет мульти-смены (workerCount ≤ 1) */
const isHalfDay = computed(() => {
  if (props.assignments.length === 0) return false
  if (workerCount.value > 1) return false // мульти имеет приоритет
  const totalPct = props.assignments.reduce((sum, a) => sum + a.percentage, 0)
  return totalPct > 40 && totalPct < 60
})

const indicatorStyle = computed(() => {
  if (props.assignments.length === 0) return {}

  const sortedAssignments = [...props.assignments].sort((a, b) => a.objectId - b.objectId)

  let cumulative = 0
  const segments = sortedAssignments.map(a => {
    const color = getObjectColor(a.objectId)
    const from = cumulative
    cumulative += a.percentage
    return `${color} ${from}% ${cumulative}%`
  })

  // Для "пол дня" — заполняем только первую половину круга
  if (isHalfDay.value) {
    return {
      background: `conic-gradient(${segments.join(', ')}, transparent 50% 100%)`
    }
  }

  return { background: `conic-gradient(${segments.join(', ')})` }
})

const cellEvents = computed(() => ({
  click: (e: Event) => { e.stopPropagation(); emit('click') },
  mousedown: (e: MouseEvent) => { e.stopPropagation(); emit('mousedown', e) },
  mouseenter: () => emit('mouseenter'),
  touchstart: (e: TouchEvent) => { emit('touchstart', e) },
  touchmove: (e: TouchEvent) => { emit('touchmove', e) }
}))
</script>

<style lang="scss" scoped>
.daily-cell {
  position: relative;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  z-index: 1;

  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;

  &:hover:not(.daily-cell--locked) {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
  }

  &:active:not(.daily-cell--locked) {
    transform: scale(0.96);
  }

  &--locked {
    cursor: not-allowed;
    opacity: 0.4;
  }

  &--range-start,
  &--range-middle,
  &--range-end {
    background: var(--crm-accent-dim) !important;
    border-color: var(--crm-accent-dim);
  }

  &--range-start {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border-left: 2px solid var(--crm-accent);
  }

  &--range-end {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    border-right: 2px solid var(--crm-accent);
  }

  &--range-middle {
    border-radius: 0;
  }

  // ← НОВЫЙ враппер для индикатора + бейджа
  &__indicator-wrapper {
    position: relative;
    z-index: 2;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__indicator {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    // border: 1px solid var(--crm-bg-surface);
    // box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
    // transition: transform 0.15s ease, box-shadow 0.15s ease;

    .daily-cell:hover & {
      box-shadow: 0 0 8px currentColor;
      filter: saturate(1.2);
    }

    // &--half {
    //   border: 1.5px dashed var(--crm-text-muted) !important;
    //   opacity: 0.8;

    //   .daily-cell:hover & {
    //     opacity: 1;
    //   }
    // }
  }

  // ← НОВЫЙ бейдж количества людей
  &__multiplier {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: var(--crm-accent);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    border: 1.5px solid var(--crm-bg-surface);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    z-index: 3;
    font-family: var(--crm-font-mono);
  }

  &__placeholder {
    position: relative;
    z-index: 2;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--crm-text-muted);
    opacity: 0.25;
    border: 1px dashed var(--crm-text-muted);
  }
}
</style>