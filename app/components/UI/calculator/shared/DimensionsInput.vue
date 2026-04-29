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
        
        <span v-if="!isManualPerimeter" class="form-helper">
          Рассчитано: √Площадь × 4
        </span>
      </div>

      <!-- 4. Площадь стен (NEW) -->
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
        
        <span v-if="!isWallAreaManual && calculatedWallArea > 0" class="form-helper">
          Рассчитано: {{ calculatedWallAreaText }}
        </span>
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
@use "@/assets/styles/calculator-vars.scss" as *;

.dimensions-input {
  background: $bg-light;
  padding: $spacing-md;
  border-radius: 8px;
  border: 1px solid $border-color;
}

.dimensions__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: $spacing-md;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: $text-primary;

  .required { color: $danger; }
  .hint-text { 
    font-weight: 400; 
    color: $text-secondary; 
    font-size: 0.75rem; 
  }
}

.auto-badge {
  background: $success;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  
  &:hover { opacity: 0.8; }
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  
  .form-input {
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid $border-color;
    border-radius: 6px;
    font-size: 1rem;
    transition: all 0.2s;
    background: $bg-white;
    
    &:focus {
      outline: none;
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.1);
    }
    
    &.is-error { border-color: $danger; background: rgba($danger, 0.05); }
    
    &.is-readonly {
      background: darken($bg-light, 5%);
      color: $text-secondary;
      cursor: default;
      border-color: transparent;
    }
  }
  
  .input-suffix {
    position: absolute;
    right: 10px;
    color: $text-secondary;
    font-size: 0.85rem;
    pointer-events: none;
  }

  .toggle-manual {
    position: absolute;
    right: 10px;
    background: none;
    border: none;
    color: $primary;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    
    &:hover { 
      background: rgba($primary, 0.1); 
      border-radius: 4px; 
    }
  }
}

.form-helper {
  font-size: 0.75rem;
  color: $text-secondary;
  margin-top: 2px;
  font-style: italic;
}

.form-error {
  font-size: 0.75rem;
  color: $danger;
}

@media (max-width: $breakpoint-md) {
  .dimensions__grid {
    grid-template-columns: 1fr;
  }
}

span {
  color: unset;
}
</style>