<!-- app/components/pages/cabinet/DailyWork/ui/CalendarCell.vue -->
<template>
  <div :class="cellClasses" :data-date="date" v-on="cellEvents">
    <!-- Tooltip с деталями объектов -->
    <div v-if="assignments.length > 0" class="daily-cell__tooltip">
      <div v-for="a in sortedAssignments" :key="a.objectId" class="tooltip-row">
        <span class="tooltip-dot" :style="{ background: getObjectColor(a.objectId) }"></span>
        <span class="tooltip-name" :title="a.objectName">{{ a.objectName }}</span>
        <span class="tooltip-value">{{ a.percentage }}% ({{ formatCurrency(a.amount) }})</span>
      </div>
      <div v-if="hasTooltipFooter" class="tooltip-footer">
        <span v-if="workerCount > 1" class="tooltip-total">
          Всего: ×{{ workerCount }} чел.
        </span>
        <span v-if="isHalfDay" class="tooltip-hint">⏱ пол дня</span>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div v-if="assignments.length === 0" class="daily-cell__placeholder" />

    <!-- Индикатор (круг с градиентом по объектам) -->
    <div v-else class="daily-cell__indicator-wrapper">
      <div
        class="daily-cell__indicator"
        :class="{ 'daily-cell__indicator--half': isHalfDay }"
        :style="indicatorStyle"
      />
      <!-- Бейдж количества людей (для мульти-контрагентов) -->
      <span v-if="displayMultiplier" class="daily-cell__multiplier">
        ×{{ displayMultiplier }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DailyAssignment } from '~/types/daily-assignments'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'

const props = defineProps<{
  date: string
  workerId: number
  dailyRate: number
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

const { formatCurrency } = useDailyAssignment()

// ── Расширенная палитра из 16 равномерно распределённых оттенков ──────────
const HUES = [
  0, 25, 50, 80, 110, 145, 175, 200,
  225, 255, 280, 310, 335, 15, 40, 65
] as const

/**
 * Возвращает уникальный цвет для объекта.
 * Добавляет вариацию светлоты и насыщенности, чтобы объекты с близкими ID
 * всё равно визуально отличались (например, ID=1 и ID=17).
 */
function getObjectColor(objectId: number): string {
  const hue = HUES[objectId % HUES.length] ?? HUES[0]
  const lightness = 55 + (objectId * 7) % 10   // 55% — 64%
  const saturation = 85 + (objectId * 3) % 10  // 85% — 94%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// ── Суммарная сумма за день ────────────────────────────────────────────
const totalAmount = computed(() =>
  props.assignments.reduce((sum, a) => sum + a.amount, 0)
)

// ── Соотношение суммы к ставке ────────────────────────────────────────
const ratio = computed(() => {
  if (!props.dailyRate || props.dailyRate <= 0) return 0
  return totalAmount.value / props.dailyRate
})

// ── Есть ли пол-дневные (дробная часть ≈ 0.5) ────────────────────────
const hasHalfDayWorker = computed(() => {
  const frac = ratio.value - Math.floor(ratio.value)
  return Math.abs(frac - 0.5) < 0.1
})

// ── Количество людей (мульти-контрагент) ──────────────────────────────
const workerCount = computed(() => {
  if (!props.dailyRate || props.dailyRate <= 0) return 1
  return Math.round(ratio.value)
})

// ── Значение для бейджа ×N ───────────────────────────────────────────
const displayMultiplier = computed(() => {
  if (ratio.value <= 1.1) return null
  const rounded = Math.round(ratio.value * 2) / 2
  if (rounded === Math.floor(rounded)) return Math.floor(rounded)
  return rounded
})

// ── Определяем "пол дня" для обычных контрагентов (ratio ≤ 1) ────────
const isHalfDay = computed(() => {
  if (props.assignments.length === 0) return false
  if (ratio.value > 1.1) return false
  const totalPct = props.assignments.reduce((sum, a) => sum + a.percentage, 0)
  return totalPct > 40 && totalPct < 60
})

// ── Отсортированные назначения для стабильного порядка в tooltip ─────
const sortedAssignments = computed(() =>
  [...props.assignments].sort((a, b) => a.objectId - b.objectId)
)

// ── Показывать ли нижнюю часть tooltip ───────────────────────────────
const hasTooltipFooter = computed(() =>
  workerCount.value > 1 || isHalfDay.value
)

// ── Классы корня ─────────────────────────────────────────────────────
const cellClasses = computed(() => ({
  'daily-cell': true,
  'daily-cell--locked': !props.isEditable,
  'daily-cell--selected': props.isSelected,
  'daily-cell--range-start': props.rangeType === 'start',
  'daily-cell--range-middle': props.rangeType === 'middle',
  'daily-cell--range-end': props.rangeType === 'end'
}))

// ── Стили индикатора: conic-gradient с зазорами между сегментами ─────
const indicatorStyle = computed(() => {
  if (props.assignments.length === 0) return {}

  let cumulative = 0
  const hasMultiple = sortedAssignments.value.length > 1

  const segments = sortedAssignments.value.map((a, idx) => {
    const color = getObjectColor(a.objectId)
    const from = cumulative
    cumulative += a.percentage

    // Между сегментами вставляем тонкий прозрачный зазор
    // (только если их несколько и это не последний сегмент)
    if (hasMultiple && idx < sortedAssignments.value.length - 1) {
      // Отступаем 0.5% на границу
      const innerTo = Math.max(from, cumulative - 0.5)
      return `${color} ${from}% ${innerTo}%, transparent ${innerTo}% ${cumulative}%`
    }
    return `${color} ${from}% ${cumulative}%`
  })

  const gradient = segments.join(', ')

  if (isHalfDay.value) {
    return {
      background: `conic-gradient(${gradient}, transparent 50% 100%)`,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)'
    }
  }

  return {
    background: `conic-gradient(${gradient})`,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.25)'
  }
})

// ── События ячейки ───────────────────────────────────────────────────
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
    z-index: 50; // поднимает над соседями, чтобы tooltip не обрезался
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

  // ── Tooltip (появляется при наведении) ───────────────────────────
  &__tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    min-width: 230px;
    max-width: 300px;
    padding: 8px 12px;
    background: var(--crm-bg-surface);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    box-shadow: var(--crm-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
    font-size: var(--crm-text-xs);
    z-index: 100;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition:
      opacity 0.15s ease,
      transform 0.15s ease,
      visibility 0.15s ease;
    white-space: nowrap;

    // Стрелочка вниз
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: var(--crm-bg-surface);
      filter: drop-shadow(0 1px 0 var(--crm-border));
    }
  }

  &:hover &__tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(0);
  }

  // ── Строка объекта в tooltip ─────────────────────────────────────
  .tooltip-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 0;

    &:not(:last-child) {
      border-bottom: 1px dashed var(--crm-border);
    }
  }

  .tooltip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
  }

  .tooltip-name {
    flex: 1;
    color: var(--crm-text-primary);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .tooltip-value {
    color: var(--crm-text-muted);
    font-family: var(--crm-font-mono);
    font-size: 11px;
    flex-shrink: 0;
  }

  // ── Футер tooltip ────────────────────────────────────────────────
  .tooltip-footer {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--crm-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .tooltip-total {
    font-weight: 600;
    color: var(--crm-accent);
    font-family: var(--crm-font-mono);
  }

  .tooltip-hint {
    color: var(--crm-text-secondary);
    font-size: 11px;
  }

  // ── Индикатор (круг) ─────────────────────────────────────────────
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
    transition: transform 0.15s ease, filter 0.15s ease;

    .daily-cell:hover & {
      filter: saturate(1.15) brightness(1.05);
    }
  }

  // ── Бейдж ×N ─────────────────────────────────────────────────────
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
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    pointer-events: none;
    z-index: 3;
    font-family: var(--crm-font-mono);
  }

  // ── Placeholder (пустая ячейка) ──────────────────────────────────
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