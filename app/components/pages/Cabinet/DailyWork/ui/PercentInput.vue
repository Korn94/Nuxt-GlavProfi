<!-- app\components\pages\cabinet\DailyWork\ui\PercentInput.vue -->
 <template>
  <div class="percent-input">
    <!-- Основной ввод -->
    <div class="percent-input__controls">
      <button type="button" class="percent-input__btn" @click="adjust(-1)" aria-label="Уменьшить">
        −
      </button>
      
      <input
        type="number"
        inputmode="decimal"
        :value="displayValue"
        @input="handleInput"
        @blur="handleBlur"
        @keydown.enter.prevent="handleBlur"
        class="percent-input__field"
        aria-label="Введите значение"
      />
      
      <button type="button" class="percent-input__btn" @click="adjust(1)" aria-label="Увеличить">
        +
      </button>
    </div>

    <!-- Вторичное значение и единица измерения -->
    <div class="percent-input__meta">
      <span class="percent-input__unit">
        {{ mode === 'percent' ? '%' : '₽' }}
      </span>
      <span class="percent-input__secondary">
        {{ mode === 'percent' ? formatCurrency(secondaryValue) : `${secondaryValue}%` }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'

const props = withDefaults(defineProps<{
  value: number
  mode: 'percent' | 'amount'
  min?: number
  max?: number
  step?: number
  secondaryValue: number
}>(), {
  min: 0,
  max: 100,
  step: undefined
})

const emit = defineEmits<{
  'update:value': [value: number]
}>()

const { formatCurrency, roundTo50 } = useDailyAssignment()

const effectiveStep = computed(() => 
  props.step ?? (props.mode === 'percent' ? 10 : 50)
)

// Показываем целое число для % и без дробей для ₽
const displayValue = computed(() => 
  props.mode === 'percent' ? Math.round(props.value) : props.value
)

function adjust(direction: number): void {
  let next = props.value + direction * effectiveStep.value
  next = clamp(next)
  if (props.mode === 'amount') next = roundTo50(next)
  emit('update:value', next)
}

function handleInput(e: Event): void {
  const val = (e.target as HTMLInputElement).value
  const num = parseFloat(val)
  if (!isNaN(num)) {
    emit('update:value', num)
  }
}

function handleBlur(): void {
  let val = clamp(props.value)
  // При работе с рублями всегда округляем до 50
  if (props.mode === 'amount') val = roundTo50(val)
  // При процентах округляем до целого
  else val = Math.round(val)
  
  emit('update:value', val)
}

function clamp(v: number): number {
  return Math.max(props.min, Math.min(props.max, v))
}
</script>

<style lang="scss" scoped>
.percent-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 200px; // Ограничиваем ширину для удобства чтения

  &__controls {
    display: flex;
    align-items: center;
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border);
    border-radius: var(--crm-radius-md);
    overflow: hidden;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 40px;
    background: transparent;
    border: none;
    color: var(--crm-text-primary);
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: var(--crm-transition);
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: var(--crm-bg-overlay);
    }

    &:active {
      background: var(--crm-accent-dim);
      color: var(--crm-accent);
    }
  }

  &__field {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--crm-text-primary);
    font-size: var(--crm-text-md);
    font-weight: 600;
    text-align: center;
    padding: 8px 4px;
    outline: none;
    font-family: var(--crm-font-sans);
    
    // Убираем стандартные стрелки инпута number
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
    // -moz-appearance: textfield;

    &:focus {
      background: var(--crm-accent-dim);
      color: var(--crm-accent);
    }
  }

  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4px;
  }

  &__unit {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    font-weight: 500;
  }

  &__secondary {
    font-size: var(--crm-text-sm);
    color: var(--crm-text-secondary);
    font-family: var(--crm-font-mono);
    letter-spacing: 0.02em;
  }
}
</style>