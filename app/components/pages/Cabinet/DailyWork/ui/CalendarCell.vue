<!-- app\components\pages\cabinet\DailyWork\ui\CalendarCell.vue -->
 <template>
  <div
    :class="[
      'daily-cell',
      { 'daily-cell--locked': !isEditable, 'daily-cell--selected': isSelected }
    ]"
    :data-date="date"
    v-on="$attrs"
    @click="$emit('click')"
  >
    <!-- Пустая ячейка -->
    <div v-if="assignments.length === 0" class="daily-cell__placeholder" />

    <!-- Заполненная ячейка (conic-gradient по долям) -->
    <div v-else class="daily-cell__indicator" :style="indicatorStyle" />

    <!-- Бейдж количества объектов -->
    <span v-if="assignments.length > 1" class="daily-cell__count">
      {{ assignments.length }}
    </span>
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
}>()

defineEmits<{
  click: []
}>()

// ── Утилиты ──────────────────────────────────────────────────────────
const HUES = [195, 150, 45, 280, 110, 240, 25, 170] as const

function getObjectColor(objectId: number): string {
  const hue = HUES[objectId % HUES.length] ?? HUES[0]
  return `hsl(${hue}, 65%, 55%)`
}

// Вычисляем CSS conic-gradient на основе процентов
const indicatorStyle = computed(() => {
  if (props.assignments.length === 0) return {}

  let cumulative = 0
  const segments = props.assignments.map(a => {
    const color = getObjectColor(a.objectId)
    const from = cumulative
    cumulative += a.percentage
    return `${color} ${from}% ${cumulative}%`
  })

  return { background: `conic-gradient(${segments.join(', ')})` }
})
</script>

<style lang="scss" scoped>
.daily-cell {
  position: relative;
  background: var(--crm-bg-surface);
  border: 1px solid var(--crm-border);
  min-height: 48px; // удобный размер для касания пальцем
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--crm-transition);
  user-select: none;
  -webkit-tap-highlight-color: transparent;

  &:hover:not(.daily-cell--locked) {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
  }

  &:active:not(.daily-cell--locked) {
    transform: scale(0.96);
  }

  // Заблокированные даты (старше 14 дней)
  &--locked {
    cursor: not-allowed;
    opacity: 0.4;
    pointer-events: auto; // оставляем включённым для hover, но click блокируем логикой
  }

  // Выделение при массовом выборе
  &--selected {
    border: 2px solid var(--crm-accent);
    background: var(--crm-accent-dim);
    box-shadow: inset 0 0 0 1px var(--crm-accent-border);
  }

  &__placeholder {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--crm-text-muted);
    opacity: 0.25;
    border: 1px dashed var(--crm-text-muted);
  }

  &__indicator {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid var(--crm-bg-surface);
    box-shadow: var(--crm-shadow-sm);
    transition: transform 0.15s ease;
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
  }
}
</style>
