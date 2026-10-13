<!-- app/components/ui/calculator/cards/FinishCardHeader.vue -->
<template>
  <header class="card-header">
    <!-- === Верхняя строка: Иконка, Название, Кнопки === -->
    <div class="card-header__top">
      <span class="card-icon">{{ config?.icon || '🔹' }}</span>
      <h4 class="card-title">{{ config?.name }}</h4>
      
      <!-- Кнопка удаления -->
      <button type="button" class="btn-delete" @click="emit('remove')" title="Удалить покрытие">
        <Icon name="material-symbols:delete-outline" size="20" />
      </button>
      
      <!-- 🔴 Кнопка "Допы" ВРЕМЕННО СКРЫТА -->
      <button
        v-if="false"
        type="button"
        class="btn-extras-toggle"
        @click="emit('toggle-extras')"
        :class="{ 'is-active': showExtras }"
        title="Показать/скрыть дополнительные работы"
      >
        <Icon name="material-symbols:add-circle-outline" size="22" />
        <span class="toggle-label">Допы</span>
      </button>
    </div>

    <!-- === Нижняя строка: Размеры + ИТОГ === -->
    <div class="card-header__bottom">
      <!-- Размеры слева -->
      <div class="dims-group">
        <span class="dims-label">Размеры:</span>
        <div class="dims-controls">
          <div class="dim-control">
            <input
              type="number"
              :value="lengthVal"
              @input="onLengthInput"
              class="dim-input"
              min="0.01"
              step="0.01"
              title="Длина"
            >
            <span class="dim-unit">м</span>
          </div>
          <span class="dim-operator">×</span>
          <div class="dim-control">
            <input
              type="number"
              :value="widthVal"
              @input="onWidthInput"
              class="dim-input"
              min="0.01"
              step="0.01"
              title="Ширина / Высота"
            >
            <span class="dim-unit">м</span>
          </div>
          <span class="dim-operator">=</span>
          <div class="area-control">
            <input
              type="number"
              :value="instance.area"
              @input="onAreaInput"
              class="area-input"
              min="0.1"
              step="0.1"
              title="Площадь покрытия"
            >
            <span class="area-unit">м²</span>
          </div>
        </div>
      </div>
      
      <!-- ✅ Итоговая стоимость карточки — СПРАВА -->
      <div class="card-total">
        <span class="card-total__label">Итого:</span>
        <span class="card-total__value">{{ formatPrice(totalPrice) }}</span>
        <span class="card-total__currency">₽</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { SurfaceInstance, FinishGroupConfig, CalculatorSection } from '~/types/calculator'

const props = defineProps<{
  config: FinishGroupConfig | undefined
  instance: SurfaceInstance
  showExtras: boolean
  totalPrice: number
  dimensions: { floorArea: number; height: number; perimeter: number | null; wallArea: number | null }
  section: CalculatorSection
}>()

const emit = defineEmits<{
  'update-area': [area: number]
  'remove': []
  'toggle-extras': []
}>()

const lengthVal = ref(0)
const widthVal = ref(0)
const isAreaManual = ref(false)

function getBaseDimensions() {
  const d = props.dimensions
  if (props.section === 'walls' || props.section === 'partitions') {
    return {
      length: Math.round((d.perimeter ?? Math.sqrt(Math.max(0, d.floorArea || 0)) * 4) * 100) / 100,
      width: Math.round((d.height || 2.7) * 100) / 100
    }
  } else {
    const side = Math.sqrt(Math.max(0, d.floorArea || 0))
    const roundedSide = Math.round(side * 100) / 100
    return { length: roundedSide, width: roundedSide }
  }
}

onMounted(() => {
  const { length, width } = getBaseDimensions()
  const calcArea = Math.round(length * width * 100) / 100
  
  if (props.instance.area > 0 && Math.abs(props.instance.area - calcArea) > 0.2) {
    isAreaManual.value = true
    lengthVal.value = Math.sqrt(props.instance.area)
    widthVal.value = Math.sqrt(props.instance.area)
  } else {
    lengthVal.value = length
    widthVal.value = width
    isAreaManual.value = false
    if (!props.instance.area || props.instance.area < 0.5) {
       emit('update-area', Math.max(0.5, calcArea))
    }
  }
})

watch(
  () => [props.dimensions.floorArea, props.dimensions.height, props.dimensions.perimeter],
  () => {
    if (!isAreaManual.value) {
      const { length, width } = getBaseDimensions()
      lengthVal.value = length
      widthVal.value = width
      const newArea = Math.round(length * width * 100) / 100
      emit('update-area', Math.max(0.5, newArea))
    }
  }
)

// Синхронизация длины/ширины, если площадь обновилась извне
watch(
  () => props.instance.area,
  (newArea) => {
    if (!newArea || newArea <= 0) return
    const expectedArea = Math.round(lengthVal.value * widthVal.value * 100) / 100
    if (Math.abs(newArea - expectedArea) > 0.05) {
      if (widthVal.value > 0) {
        lengthVal.value = Math.round((newArea / widthVal.value) * 100) / 100
      } else {
        const side = Math.sqrt(newArea)
        lengthVal.value = Math.round(side * 100) / 100
        widthVal.value = Math.round(side * 100) / 100
      }
    }
  }
)

function onLengthInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(val) && val >= 0) {
    lengthVal.value = val
    isAreaManual.value = true
    const newArea = Math.round(lengthVal.value * widthVal.value * 100) / 100
    emit('update-area', Math.max(0.1, newArea))
  }
}

function onWidthInput(e: Event) {
  const val = parseFloat((e.target as HTMLInputElement).value)
  if (!isNaN(val) && val >= 0) {
    widthVal.value = val
    isAreaManual.value = true
    const newArea = Math.round(lengthVal.value * widthVal.value * 100) / 100
    emit('update-area', Math.max(0.1, newArea))
  }
}

function onAreaInput(event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  const newArea = isNaN(val) ? 0.5 : Math.max(0.1, val)
  isAreaManual.value = true
  
  if (widthVal.value > 0) {
    lengthVal.value = Math.round((newArea / widthVal.value) * 100) / 100
  } else {
    const side = Math.sqrt(newArea)
    lengthVal.value = Math.round(side * 100) / 100
    widthVal.value = Math.round(side * 100) / 100
  }
  
  emit('update-area', newArea)
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// === Шапка карточки покрытия (тёмная тема) ===
.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

// === Верхняя строка (Название + Кнопки) ===
.card-header__top {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.card-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  line-height: 1;
}

.card-title {
  margin: 0;
  flex: 1;
  font-size: 1.05rem;
  font-weight: 600;
  color: $text-light;
  font-family: 'Rubik', sans-serif;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// === Нижняя строка: Размеры слева, Итог справа ===
.card-header__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-left: calc(1.4rem + 0.8rem); // Отступ под иконку для выравнивания
}

// === Группа размеров ===
.dims-group {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex: 1;
  min-width: 0;
}

.dims-label {
  font-size: 0.82rem;
  color: rgba($text-light, 0.45);
  font-family: 'Rubik', sans-serif;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.dims-controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.35rem;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.dim-control,
.area-control {
  position: relative;
}

.dim-control {
  width: 100px;
}

.area-control {
  width: 85px;
}

.dim-input,
.area-input {
  width: 100%;
  padding: 0.4rem 1.8rem 0.4rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  text-align: center;
  font-size: 0.85rem;
  font-weight: 500;
  font-family: 'Rubik', sans-serif;
  color: $text-light;
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
  appearance: textfield;
  -moz-appearance: textfield;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
    border-color: $blue;
    background: rgba(0, 195, 245, 0.06);
    box-shadow: 0 0 0 2px rgba(0, 195, 245, 0.1);
  }
}

.area-input {
  font-weight: 600;
  color: $blue-light;
  border-color: rgba(0, 195, 245, 0.3);
  background: rgba(0, 195, 245, 0.05);
}

.dim-unit,
.area-unit {
  position: absolute;
  right: 0.45rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  font-weight: 500;
  pointer-events: none;
  font-family: 'Rubik', sans-serif;
}

div {
  color: $text-light;
}

.area-unit {
  color: $blue-light;
  opacity: 0.8;
}

.dim-operator {
  color: rgba($text-light, 0.35);
  font-size: 0.8rem;
  font-weight: 500;
  user-select: none;
  padding: 0 0.1rem;
}

// === ✅ Итоговая стоимость карточки (стиль как в BlockSummary) ===
.card-total {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
  padding: 0.4rem 1rem;
  background: rgba(0, 195, 245, 0.06);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-radius: 10px;
  white-space: nowrap;
  flex-shrink: 0;
  
  &__label {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba($text-light, 0.6);
    font-family: 'Rubik', sans-serif;
  }
  
  &__value {
    font-size: 1.4rem;
    font-weight: 800;
    background: $blue-gradient;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'Rubik', sans-serif;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  
  &__currency {
    font-size: 0.9rem;
    font-weight: 700;
    color: rgba($blue-light, 0.8);
    font-family: 'Rubik', sans-serif;
  }
}

// === Кнопка удаления ===
.btn-delete {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(#ff6b6b, 0.6);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #ff6b6b;
    background: rgba(#ff6b6b, 0.12);
  }
}

// === Кнопка "Допы" (скрыта, но стили сохранены) ===
.btn-extras-toggle {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
  border: 1.5px solid rgba(0, 195, 245, 0.35);
  background: transparent;
  color: $blue-light;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: 'Rubik', sans-serif;
  transition: all 0.25s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(0, 195, 245, 0.08);
    border-color: $blue;
  }

  &.is-active {
    background: $blue-gradient;
    border-color: transparent;
    color: $background-dark;
    .toggle-label { font-weight: 600; }
  }

  .toggle-label { margin-left: 0.1rem; }
}

// === Адаптив ===
@media (max-width: 640px) {
  .card-header {
    gap: 0.6rem;
    padding: 0.9rem 1rem;
  }

  .card-header__top {
    gap: 0.6rem;
  }

  .card-header__bottom {
    flex-direction: column;
    align-items: stretch;
    padding-left: 0;
    gap: 0.8rem;
  }

  .dims-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .dims-label {
    width: 100%;
  }

  .dims-controls {
    width: 100%;
  }

  .dim-control { flex: 1; min-width: 0; }
  .area-control { flex: 1.2; min-width: 0; }

  .card-total {
    align-self: flex-end;
    justify-content: flex-end;
  }
}
</style>