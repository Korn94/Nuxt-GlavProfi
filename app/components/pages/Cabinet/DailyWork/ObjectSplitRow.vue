<!-- app\components\pages\cabinet\DailyWork\ObjectSplitRow.vue -->
 <template>
  <div class="split-row">
    <!-- Информация об объекте -->
    <div class="split-row__info">
      <div class="split-row__dot" :style="dotStyle" />
      <span class="split-row__name" :title="objectName">{{ objectName }}</span>
    </div>

    <!-- Управление долей -->
    <div class="split-row__control">
      <!-- Передаем значение, режим и рассчитанное вторичное значение -->
      <PercentInput
        :value="currentValue"
        :mode="mode"
        :secondary-value="secondaryValue"
        @update:value="$emit('update:value', $event)"
      />
      
      <button 
        v-if="isRemovable" 
        type="button" 
        class="split-row__remove" 
        aria-label="Удалить объект"
        @click="$emit('remove')"
      >
        <i class="material-symbols-light">close</i>
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
  value: number         // Текущее значение (зависит от mode)
  mode: 'percent' | 'amount'
  dailyRate: number
  isRemovable?: boolean
}>(), {
  isRemovable: true
})

const emit = defineEmits<{
  'update:value': [value: number]
  'remove': []
}>()

// ── Логика ────────────────────────────────────────────────────────

const HUES = [195, 150, 45, 280, 110, 240, 25, 170] as const

// Цвет объекта на основе ID
const dotStyle = computed(() => {
  const hue = HUES[props.objectId % HUES.length] ?? HUES[0]
  return { backgroundColor: `hsl(${hue}, 65%, 55%)` }
})

// Текущее значение, которое редактируется
const currentValue = computed(() => props.value)

// Вторичное значение для отображения в PercentInput
// Если режим %, показываем сумму. Если режим ₽, показываем %.
const secondaryValue = computed(() => {
  if (props.mode === 'percent') {
    // Процент -> Сумма
    return (props.dailyRate * props.value) / 100
  } else {
    // Сумма -> Процент
    return (props.value / props.dailyRate) * 100
  }
})
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