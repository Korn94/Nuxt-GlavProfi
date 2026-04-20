<!-- app\components\pages\cabinet\DailyWork\ui\PercentInput.vue -->
<template>
  <div 
    class="percent-input" 
    :class="{ 
      'percent-input--focused': isFocused,
      'percent-input--single': isSingleObject,
      'percent-input--hidden': isSingleObject && hideWhenSingle 
    }"
  >
    
    <!-- Заголовок поля -->
    <label class="percent-input__label">
      <span>Доля</span>
      <span v-if="secondaryValue !== undefined && !isSingleObject" class="percent-input__label-sub">
        ≈ {{ formatCurrency(secondaryValue) }}
      </span>
    </label>

    <!-- Контролы: кнопки + инпут -->
    <div class="percent-input__control-group" v-if="!isSingleObject || !hideWhenSingle">
      
      <!-- Кнопка "−" -->
      <button
        type="button"
        class="percent-input__btn percent-input__btn--dec"
        @click="handleDecrement"
        :disabled="clampedValue <= min"
        aria-label="Уменьшить"
      >
        −
      </button>

      <!-- Поле ввода -->
      <div class="percent-input__field-wrapper">
        <input
          ref="inputRef"
          type="number"
          inputmode="decimal"
          :value="displayValue"
          @input="handleInput"
          @blur="handleBlur"
          @focus="onFocus"
          @keydown.enter.prevent="handleBlur"
          @keydown.arrow-up.prevent="handleIncrement"
          @keydown.arrow-down.prevent="handleDecrement"
          class="percent-input__field"
          aria-label="Процент распределения"
        />
        <span class="percent-input__suffix">%</span>
      </div>

      <!-- Кнопка "+" -->
      <button
        type="button"
        class="percent-input__btn percent-input__btn--inc"
        @click="handleIncrement"
        :disabled="clampedValue >= max"
        aria-label="Увеличить"
      >
        +
      </button>

    </div>

    <!-- Режим одного объекта: показываем только значение -->
    <div v-else class="percent-input__single-value">
      <span class="percent-input__value">{{ displayValue }}%</span>
      <span v-if="secondaryValue !== undefined" class="percent-input__value-sub">
        {{ formatCurrency(secondaryValue) }}
      </span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useDailyAssignment } from '~/composables/daily-work/useDailyAssignment'

const props = withDefaults(defineProps<{
  value: number
  min?: number
  max?: number
  step?: number
  secondaryValue?: number
  isSingleObject?: boolean
  hideWhenSingle?: boolean
}>(), {
  min: 0,
  max: 100,
  step: 10,
  secondaryValue: undefined,
  isSingleObject: false,
  hideWhenSingle: true
})

const emit = defineEmits<{
  'update:value': [value: number]
}>()

const { formatCurrency } = useDailyAssignment()
const inputRef = ref<HTMLInputElement | null>(null)
const isFocused = ref(false)

// ✅ Защита от двойного срабатывания (throttle)
let lastClickTime = 0
const CLICK_THROTTLE_MS = 150 // мин. интервал между кликами

const clampedValue = computed(() => 
  Math.max(props.min, Math.min(props.max, props.value))
)

const displayValue = computed(() => 
  Math.round(clampedValue.value)
)

function emitValue(val: number) {
  const clamped = Math.max(props.min, Math.min(props.max, Math.round(val)))
  emit('update:value', clamped)
}

/** Проверка: не слишком ли быстро идёт клик */
function canProcessClick(): boolean {
  const now = Date.now()
  if (now - lastClickTime < CLICK_THROTTLE_MS) {
    return false
  }
  lastClickTime = now
  return true
}

function handleIncrement() {
  if (!canProcessClick()) return
  emitValue(clampedValue.value + props.step)
  focusInputWithoutSelect()
}

function handleDecrement() {
  if (!canProcessClick()) return
  emitValue(clampedValue.value - props.step)
  focusInputWithoutSelect()
}

function handleInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  const num = parseFloat(val)
  if (!isNaN(num)) {
    emit('update:value', num)
  }
}

function handleBlur() {
  isFocused.value = false
  emitValue(clampedValue.value)
}

function onFocus() {
  isFocused.value = true
}

async function focusInputWithoutSelect() {
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    const len = inputRef.value.value.length
    inputRef.value.setSelectionRange(len, len)
  }
}

const ariaValueText = computed(() => 
  `${displayValue.value} процентов${props.secondaryValue ? `, ${formatCurrency(props.secondaryValue)}` : ''}`
)
</script>

<style lang="scss" scoped>
.percent-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  max-width: 200px;
  transition: opacity 0.15s ease;

  &--hidden {
    opacity: 0; pointer-events: none; height: 0; margin: 0; padding: 0; overflow: hidden;
  }

  &__label {
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: var(--crm-text-xs); font-weight: 600; color: var(--crm-text-muted);
    text-transform: uppercase; letter-spacing: 0.04em; line-height: 1;
  }

  &__label-sub {
    font-weight: 400; color: var(--crm-text-secondary);
    font-family: var(--crm-font-mono); letter-spacing: 0; text-transform: none;
  }

  &__control-group {
    display: flex; align-items: stretch;
    background: var(--crm-bg-elevated);
    border: 2px solid var(--crm-border);
    border-radius: var(--crm-radius-lg);
    overflow: hidden;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    .percent-input--focused & {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }
  }

  &__btn {
    display: flex; align-items: center; justify-content: center;
    width: 40px;
    background: transparent;
    border: none;
    color: var(--crm-text-primary);
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
    
    // ✅ Быстрый отклик на тач без дублирования событий
    touch-action: manipulation;

    &:hover:not(:disabled) {
      background: var(--crm-bg-overlay);
    }

    &:active:not(:disabled) {
      background: var(--crm-accent-dim);
      color: var(--crm-accent);
      // ✅ Визуальный фидбек вместо мгновенного изменения значения
      transform: scale(0.95);
      transition: transform 0.1s ease;
    }

    &:disabled {
      opacity: 0.3; cursor: not-allowed;
    }

    &--dec { border-right: 1px solid var(--crm-border); }
    &--inc { border-left: 1px solid var(--crm-border); }
  }

  &__field-wrapper {
    position: relative; flex: 1; display: flex; align-items: center;
  }

  &__field {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--crm-text-primary);
    font-size: var(--crm-text-lg);
    font-weight: 700;
    text-align: center;
    padding: 10px 28px 10px 10px;
    outline: none;
    font-family: var(--crm-font-sans);
    
    // ❗ Убираем нативные стрелки
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      appearance: none;
      margin: 0;
    }
    -moz-appearance: textfield;
    appearance: textfield;

    &::selection {
      background: var(--crm-accent-dim);
    }
  }

  &__suffix {
    position: absolute; right: 10px; top: 50%;
    transform: translateY(-50%);
    font-size: var(--crm-text-sm); font-weight: 600;
    color: var(--crm-text-muted);
    pointer-events: none; user-select: none;
  }

  &__single-value {
    display: flex; flex-direction: column; align-items: center; padding: 8px 0;
  }

  &__value {
    font-size: var(--crm-text-xl); font-weight: 700;
    color: var(--crm-text-primary); line-height: 1;
  }

  &__value-sub {
    font-size: var(--crm-text-xs); color: var(--crm-text-secondary);
    font-family: var(--crm-font-mono); margin-top: 4px;
  }

  &--focused {
    .percent-input__label { color: var(--crm-accent); }
  }
}

:deep([data-theme="dark"]) {
  .percent-input__control-group { background: var(--crm-bg-surface); }
}
</style>