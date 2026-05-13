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
    <!-- ✅ Индикатор сдвигаем выше по z-index, чтобы он был поверх выделения -->
    <div v-if="assignments.length === 0" class="daily-cell__placeholder" />
    <div v-else class="daily-cell__indicator" :style="indicatorStyle" />
    <!-- <span v-if="assignments.length > 1" class="daily-cell__count">
      {{ assignments.length }}
    </span> -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { DailyAssignment } from '~/types/daily-assignments'

const props = defineProps<{
  date: string
  workerId: number
  assignments: DailyAssignment[]
  isEditable: boolean
  isSelected: boolean
  rangeType?: 'start' | 'middle' | 'end' // ✅ Новый проп
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

const indicatorStyle = computed(() => {
  if (props.assignments.length === 0) return {}

  // Сортируем назначения по objectId для консистентного отображения цветов
  const sortedAssignments = [...props.assignments].sort((a, b) => a.objectId - b.objectId)

  let cumulative = 0
  const segments = sortedAssignments.map(a => {
    const color = getObjectColor(a.objectId)
    const from = cumulative
    cumulative += a.percentage
    return `${color} ${from}% ${cumulative}%`
  })
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
  
  // 🔹 КРИТИЧНО: запрещаем браузеру обрабатывать тач как скролл
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  
  // Для лучшего отклика на мобильных
  -webkit-tap-highlight-color: transparent;

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

  // ✅ ПРОСТОЕ ВЫДЕЛЕНИЕ ДИАПАЗОНА — без ::before
  &--range-start,
  &--range-middle,
  &--range-end {
    background: var(--crm-accent-dim) !important; // !important перебивает :hover
    border-color: var(--crm-accent-dim);
  }

  // Закругления только по краям
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

  // ✅ Индикатор поверх фона
  &__indicator {
    position: relative;
    z-index: 2;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--crm-bg-surface);
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.3);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    
    // 🔥 Неоновое свечение при hover
    .daily-cell:hover & {
      box-shadow: 0 0 8px currentColor;
      filter: saturate(1.2);
    }
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

  &__count {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
    background: var(--crm-text-primary);
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--crm-shadow-sm);
    pointer-events: none;
    z-index: 3;
  }
}
</style>