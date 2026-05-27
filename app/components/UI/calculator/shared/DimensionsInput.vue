<!-- app/components/ui/calculator/shared/DimensionsInput.vue -->
<template>
  <div class="dimensions-input">
    <div class="dimensions__grid">

      <!-- 1. Площадь пола (Обязательно) -->
      <div class="form-group">
        <label for="calc-floor-area" class="form-label">
          Площадь пола <span class="required">*</span>
        </label>
        <div class="input-wrapper">
          <input
            id="calc-floor-area"
            type="number"
            :value="modelFloorArea"
            @input="onFloorAreaInput"
            @blur="onFloorAreaBlur"
            class="form-input"
            :class="{ 'is-error': floorAreaError }"
            min="1"
            step="0.5"
            placeholder="50"
          >
          <span class="input-suffix">м²</span>
        </div>
        <span v-if="floorAreaError" class="form-error">{{ floorAreaError }}</span>
      </div>

      <!-- 2. Высота потолка -->
      <div class="form-group">
        <label for="calc-height" class="form-label">
          Высота потолка
          <span class="hint-text">(стандарт 2.7 м)</span>
        </label>
        <div class="input-wrapper">
          <input
            id="calc-height"
            type="number"
            :value="modelHeight"
            @input="onHeightInput"
            class="form-input"
            min="2.0"
            max="10"
            step="0.1"
            placeholder="2.7"
          >
          <span class="input-suffix">м</span>
        </div>
      </div>

      <!-- 3. Периметр стен -->
      <div class="form-group">
        <div class="label-row">
          <label class="form-label" for="calc-perimeter">Периметр стен</label>
          <button
            v-if="!isManualPerimeter"
            type="button"
            class="auto-badge"
            @click="enableManualPerimeter"
            title="Редактировать вручную"
          >
            авто
          </button>
        </div>

        <div class="input-wrapper">
          <input
            id="calc-perimeter"
            type="number"
            :value="modelPerimeter"
            @input="onPerimeterInput"
            class="form-input"
            :class="{ 'is-readonly': !isManualPerimeter }"
            :readonly="!isManualPerimeter"
            min="1"
            step="0.5"
            placeholder="~28.3"
          >
          <span class="input-suffix">м.п.</span>

          <button
            v-if="isManualPerimeter"
            type="button"
            class="toggle-manual"
            @click="disableManualPerimeter"
            title="Вернуть авто-расчёт"
          >
            <Icon name="material-symbols:calculate" size="18" />
          </button>
        </div>

        <p v-if="!isManualPerimeter" class="form-helper">
          Рассчитано: √Площадь × 4
        </p>
      </div>

      <!-- 4. Площадь стен -->
      <div class="form-group">
        <div class="label-row">
          <label class="form-label" for="calc-wall-area">Площадь стен</label>
          <button
            v-if="!isWallAreaManual"
            type="button"
            class="auto-badge"
            @click="emit('toggle-wall-manual')"
            title="Редактировать вручную"
          >
            авто
          </button>
        </div>

        <div class="input-wrapper">
          <input
            id="calc-wall-area"
            type="number"
            :value="modelWallArea"
            @input="onWallAreaInput"
            class="form-input"
            :class="{ 'is-readonly': !isWallAreaManual }"
            :readonly="!isWallAreaManual"
            min="0"
            step="0.5"
            placeholder="~135"
          >
          <span class="input-suffix">м²</span>

          <button
            v-if="isWallAreaManual"
            type="button"
            class="toggle-manual"
            @click="emit('toggle-wall-manual')"
            title="Вернуть авто-расчёт"
          >
            <Icon name="material-symbols:calculate" size="18" />
          </button>
        </div>

        <p v-if="!isWallAreaManual && calculatedWallArea > 0" class="form-helper">
          Рассчитано: {{ calculatedWallAreaText }}
        </p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  modelFloorArea: number
  modelHeight: number
  modelPerimeter: number | null
  modelWallArea: number | null
  isWallAreaManual: boolean
}>()

const emit = defineEmits<{
  (e: 'update:floor-area', value: number): void
  (e: 'update:height', value: number): void
  (e: 'update:perimeter', value: number | null): void
  (e: 'update:wall-area', value: number | null): void
  (e: 'toggle-wall-manual'): void
}>()

// -----------------------------------------------------------------------------
// 2. Состояние
// -----------------------------------------------------------------------------
const isManualPerimeter = ref(false)
const floorAreaError = ref<string | null>(null)

// -----------------------------------------------------------------------------
// 3. Вычисления
// -----------------------------------------------------------------------------

/** Авто-расчёт площади стен: Периметр × Высота */
const calculatedWallArea = computed(() => {
  const p = props.modelPerimeter ?? 4 * Math.sqrt(Math.max(0, props.modelFloorArea))
  const h = Math.max(0, props.modelHeight)
  if (p <= 0 || h <= 0) return 0
  return Math.round(p * h * 10) / 10
})

/** Текст подсказки для площади стен */
const calculatedWallAreaText = computed(() => {
  const pVal = props.modelPerimeter !== null ? props.modelPerimeter.toFixed(1) : 'авто'
  return `${pVal} м.п. × ${props.modelHeight} м = ${calculatedWallArea.value} м²`
})

/**
 * Синхронизация периметра при изменении площади пола (только в авто-режиме)
 */
watch(() => props.modelFloorArea, (newArea) => {
  if (!isManualPerimeter.value && newArea > 0) {
    const autoP = Math.round(4 * Math.sqrt(newArea) * 10) / 10
    emit('update:perimeter', autoP)
    console.log('📏 Авто-периметр обновлён:', autoP, 'м.п.')
  }
})

// -----------------------------------------------------------------------------
// 4. Обработчики
// -----------------------------------------------------------------------------

function onFloorAreaInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (isNaN(val)) return
  emit('update:floor-area', val)
  floorAreaError.value = null
}

function onFloorAreaBlur() {
  if (props.modelFloorArea <= 0) {
    floorAreaError.value = 'Введите площадь больше 0'
  } else {
    floorAreaError.value = null
  }
}

function onHeightInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  emit('update:height', isNaN(val) ? 2.7 : val)
}

function onPerimeterInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)

  if (!isManualPerimeter.value && !isNaN(val) && val > 0) {
    enableManualPerimeter()
  }

  emit('update:perimeter', isNaN(val) ? null : val)
}

function enableManualPerimeter() {
  isManualPerimeter.value = true
  console.log('📝 Периметр переведён в ручной режим')
}

function disableManualPerimeter() {
  isManualPerimeter.value = false
  const autoP = Math.round(4 * Math.sqrt(Math.max(0, props.modelFloorArea)) * 10) / 10
  emit('update:perimeter', autoP > 0 ? autoP : null)
  console.log('🔄 Периметр возвращён к авто-расчёту:', autoP, 'м.п.')
}

function onWallAreaInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)

  // Если пользователь начал вводить данные в заблокированное поле → разблокируем
  if (!props.isWallAreaManual && !isNaN(val) && val >= 0) {
    emit('toggle-wall-manual')
  }

  emit('update:wall-area', isNaN(val) ? null : val)
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// === Контейнер параметров (тёмная карточка внутри калькулятора) ===
.dimensions-input {
  background: rgba(255, 255, 255, 0.04);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  position: relative;
  z-index: 1;
}

.dimensions__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.2rem;
}

// === Группа поля ===
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

// === Лейбл ===
.form-label {
  font-size: 0.88rem;
  font-weight: 500;
  color: rgba($text-light, 0.9);
  font-family: 'Rubik', sans-serif;

  .required {
    color: #ff6b6b;
  }

  .hint-text {
    font-weight: 400;
    color: rgba($text-light, 0.5);
    font-size: 0.78rem;
    margin-left: 0.3rem;
  }
}

// === Бейдж "авто" ===
.auto-badge {
  background: rgba(0, 161, 42, 0.2);
  color: #4ade80;
  border: 1px solid rgba(0, 161, 42, 0.3);
  border-radius: 50px;
  padding: 0.15rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 600;
  font-family: 'Rubik', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &:hover {
    background: rgba(0, 161, 42, 0.35);
    border-color: rgba(0, 161, 42, 0.5);
  }
}

// === Обёртка инпута ===
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;

  .form-input {
    width: 100%;
    padding: 0.7rem 2.8rem 0.7rem 1rem;
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    font-size: 1rem;
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    transition: all 0.25s ease;
    background: rgba(255, 255, 255, 0.04);
    color: $text-light;

    &::placeholder {
      color: rgba($text-light, 0.35);
    }

    &:focus {
      outline: none;
      border-color: $blue;
      background: rgba(0, 195, 245, 0.06);
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
    }

    &.is-error {
      border-color: rgba(#ff6b6b, 0.6);
      background: rgba(#ff6b6b, 0.06);

      &:focus {
        border-color: #ff6b6b;
        box-shadow: 0 0 0 3px rgba(#ff6b6b, 0.12);
      }
    }

    &.is-readonly {
      color: rgba($text-light, 0.55);
      cursor: default;
      border-color: rgba(255, 255, 255, 0.06);
      background: rgba(255, 255, 255, 0.02);
    }

    // Убираем стрелки number-инпута
    -moz-appearance: textfield;
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }

  .input-suffix {
    position: absolute;
    right: 12px;
    color: rgba($text-light, 0.45);
    font-size: 0.85rem;
    font-weight: 500;
    pointer-events: none;
    font-family: 'Rubik', sans-serif;
  }

  .toggle-manual {
    position: absolute;
    right: 8px;
    background: rgba(0, 195, 245, 0.1);
    border: none;
    color: $blue-light;
    cursor: pointer;
    padding: 0.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 195, 245, 0.2);
      color: #fff;
    }
  }
}

// === Подсказка под полем ===
.form-helper {
  font-size: 0.75rem;
  color: rgba($text-light, 0.45);
  margin-top: 0.15rem;
  font-style: italic;
  line-height: 1.4;
}

// === Ошибка валидации ===
.form-error {
  font-size: 0.78rem;
  color: #ff8c8c;
  margin-top: 0.1rem;
}

// === Адаптив ===
@media (max-width: 768px) {
  .dimensions-input {
    padding: 1.2rem;
  }

  .dimensions__grid {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .dimensions__grid {
    grid-template-columns: 1fr;
  }
}
</style>