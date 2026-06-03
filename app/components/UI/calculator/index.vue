<!-- app/components/ui/calculator/index.vue -->
<template>
  <div class="calculator-wrapper" :class="{ 'is-loading': pending }">

    <h2 class="calc-title">Калькулятор <span>ремонта</span></h2>

    <!-- 1. Параметры помещения -->
    <DimensionsInput
      :model-floor-area="state.dimensions.floorArea"
      @update:floor-area="updateFloorArea"
      :model-height="state.dimensions.height"
      @update:height="updateHeight"
      :model-perimeter="state.dimensions.perimeter"
      @update:perimeter="updatePerimeter"
      :model-wall-area="state.dimensions.wallArea"
      @update:wall-area="updateWallArea"
      :is-wall-area-manual="state.dimensions.isWallAreaManual"
      @toggle-wall-manual="toggleWallAreaManual"
      class="calc-dimensions"
    />

    <!-- 2. Переключатель секций -->
    <SectionTabs v-model="state.section" class="calc-tabs" />

    <!-- 3. Лоадер -->
    <div v-if="pending" class="calc-state calc-state--loading">
      <div class="calc-state__spinner" />
      <p class="calc-state__text">Загружаем актуальные цены...</p>
    </div>

    <!-- 4. Основной контент -->
    <template v-else-if="sections">

      <!-- Блок 1: Демонтаж и подготовка -->
      <BlockDemolition
        :available-items="demolitionItems"
        :selected-works="state.demolitionWorks"
        :all-works="allWorksFlat"
        :section="state.section"
        @add="addDemolitionWork"
        @remove="removeDemolitionWork"
        @update-qty="updateDemolitionQty"
      />

      <!-- Блок 2: Чистовые покрытия -->
      <BlockFinishes
        :available-groups="availableGroups"
        :surface-instances="state.surfaceInstances"
        :all-works="allWorksFlat"
        :section="state.section"
        :dimensions="state.dimensions"
        @add="addSurfaceInstance"
        @remove="removeSurfaceInstance"
        @update-area="({ instanceId, area }) => updateInstanceArea(instanceId, area)"
        @update-option="({ instanceId, optionKey, value }) => updateInstanceOption(instanceId, optionKey, value)"
        @toggle-exclusion="({ instanceId, itemId }) => toggleInstanceItemExclusion(instanceId, itemId)"
        @add-extra="({ instanceId, itemId }) => addInstanceExtra(instanceId, itemId)"
        @remove-extra="({ instanceId, itemId }) => removeInstanceExtra(instanceId, itemId)"
        @update-extra-qty="({ instanceId, itemId, qty }) => updateInstanceExtraQty(instanceId, itemId, qty)"
      />

      <!-- Блок 3: Дополнительные работы (поштучные) -->
      <BlockPieceWorks
        :available-items="allPieceWorks"
        :selected-works="state.pieceWorks"
        :all-works="allWorksFlat"
        :section="state.section"
        @add="addPieceWork"
        @remove="removePieceWork"
        @update-qty="updatePieceQty"
      />

      <!-- Блок 4: Итог и заявка -->
      <BlockSummary
        :result="result"
        :area="state.dimensions.floorArea"
        :calculator-state="state"
        :all-works="allWorksFlat"
        source-label="Калькулятор ремонта на сайте ГлавПрофи"
      />

    </template>

    <!-- 5. Ошибка загрузки -->
    <div v-else-if="error" class="calc-state calc-state--error">
      <div class="calc-state__icon">
        <Icon name="mdi:alert-circle-outline" size="42" />
      </div>
      <p class="calc-state__title">Не удалось загрузить прайс-лист</p>
      <p class="calc-state__text">Проверьте подключение и попробуйте снова</p>
      <button class="calc-state__retry" @click="refresh()">
        <Icon name="mdi:refresh" size="18" />
        <span>Попробовать снова</span>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePriceFetcher } from '~/composables/calculator/usePriceFetcher'
import { useCalculatorState } from '~/composables/calculator/useCalculatorState'
import { useCalculatorCore } from '~/composables/calculator/useCalculatorCore'
import { FINISH_GROUPS } from '~/utils/finish-groups'

// -----------------------------------------------------------------------------
// 1. Импорт компонентов
// -----------------------------------------------------------------------------
import SectionTabs from './shared/SectionTabs.vue'
import DimensionsInput from './shared/DimensionsInput.vue'
import BlockDemolition from './blocks/BlockDemolition.vue'
import BlockFinishes from './blocks/BlockFinishes.vue'
import BlockPieceWorks from './blocks/BlockPieceWorks.vue'
import BlockSummary from './blocks/BlockSummary.vue'

// -----------------------------------------------------------------------------
// 2. Данные и Логика
// -----------------------------------------------------------------------------
const { sections, pending, error, refresh } = usePriceFetcher()
const {
  state,
  // Параметры помещения
  updateFloorArea,
  updateHeight,
  updatePerimeter,
  updateWallArea,
  toggleWallAreaManual,
  // Демонтаж
  addDemolitionWork, removeDemolitionWork, updateDemolitionQty,
  // Покрытия
  addSurfaceInstance, removeSurfaceInstance, updateInstanceArea,
  updateInstanceOption, toggleInstanceItemExclusion,
  // Штучные работы
  addPieceWork, removePieceWork, updatePieceQty
} = useCalculatorState()

// Плоский массив всех работ для ядра расчёта и поиска
const allWorksFlat = computed(() => {
  if (!sections.value) return []
  return Object.values(sections.value).flatMap(s => [...s.standard, ...s.piece])
})

// Инициализация ядра расчёта
const { result } = useCalculatorCore(state, allWorksFlat)

// Фильтрация данных для текущей активной секции
const currentSectionData = computed(() => sections.value?.[state.section] || { standard: [], piece: [] })
const availableGroups = computed(() => Object.values(FINISH_GROUPS).filter(g => g.section === state.section))

// Стабильный список всех штучных/погонных работ из ТЕКУЩЕЙ секции
const allPieceWorks = computed(() =>
  allWorksFlat.value.filter(w =>
    (w.normalizedUnit === 'piece' || w.normalizedUnit === 'linear') &&
    w.section === state.section
  )
)

// Демонтаж берётся только из текущей секции
const demolitionItems = computed(() =>
  allWorksFlat.value.filter(w => w.isDemolition && w.section === state.section)
)

// -----------------------------------------------------------------------------
// 3. Адаптеры для допов внутри карточки
// -----------------------------------------------------------------------------
function addInstanceExtra(instanceId: string, itemId: number) {
  const inst = state.surfaceInstances.find(i => i.instanceId === instanceId)
  if (inst && !inst.extras.some(e => e.itemId === itemId)) {
    inst.extras.push({ itemId, qty: 1 })
    // console.log(`➕ Доп. работа добавлена к инстансу ${instanceId}: ${itemId}`)
  }
}

function removeInstanceExtra(instanceId: string, itemId: number) {
  const inst = state.surfaceInstances.find(i => i.instanceId === instanceId)
  if (inst) inst.extras = inst.extras.filter(e => e.itemId !== itemId)
}

function updateInstanceExtraQty(instanceId: string, itemId: number, qty: number) {
  const extra = state.surfaceInstances.find(i => i.instanceId === instanceId)?.extras.find(e => e.itemId === itemId)
  if (extra) extra.qty = Math.max(1, qty)
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// Переопределяем цвет всех span внутри калькулятора на светлый
// (иначе глобальный `span { color: $blue }` подсвечивает всё синим)
.calculator-wrapper :deep(span) {
  color: inherit;
}

// === Обёртка карточки калькулятора (тёмная тема) ===
.calculator-wrapper {
  position: relative;
  background: $background-dark;
  color: $text-light;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(0, 195, 245, 0.05);
  overflow: clip;
  font-family: 'Rubik', sans-serif;
  padding: 3rem;

  // Градиентная линия сверху (как в ApplicationCTA)
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $blue-gradient;
  }

  // Декоративное свечение
  &::after {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 400px;
    height: 400px;
    background: radial-gradient(
      circle,
      rgba(0, 195, 245, 0.08) 0%,
      transparent 70%
    );
    border-radius: 50%;
    pointer-events: none;
  }

  &.is-loading {
    pointer-events: none;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    padding: 2rem 1.3rem;
    border-radius: 12px;
  }
}

// === Заголовок (в стиле остальных заголовков страниц) ===
.calc-title {
  font-family: 'Rubik', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  color: $text-light;
  margin: 0 0 2.5rem;
  line-height: 1.25;
  position: relative;
  padding-bottom: 1rem;
  text-align: center;

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: $blue-gradient;
    border-radius: 2px;
    box-shadow: 0 0 10px $blue50;
  }

  :deep(span) {
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  @media (max-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 2rem;
  }
}

// === Блок параметров и табы ===
.calc-dimensions {
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.calc-tabs {
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

// === Универсальные состояния: лоадер / ошибка ===
.calc-state {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 3.5rem 2rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: $border-radius;

  // --- Лоадер ---
  &--loading {
    .calc-state__text {
      color: rgba($text-light, 0.75);
    }
  }

  &__spinner {
    width: 42px;
    height: 42px;
    border: 3px solid rgba($text-light, 0.15);
    border-top-color: $blue;
    border-radius: 50%;
    animation: calcSpin 0.9s linear infinite;
    margin-bottom: 0.5rem;
  }

  // --- Ошибка ---
  &--error {
    border-color: rgba($red, 0.3);
    background: rgba($red, 0.05);
  }

  &__icon {
    color: #ff8c8c;
    margin-bottom: 0.3rem;
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: $text-light;
    margin: 0;
  }

  &__text {
    font-size: 0.95rem;
    line-height: 1.5;
    color: rgba($text-light, 0.7);
    margin: 0;
    max-width: 400px;
  }

  &__retry {
    margin-top: 0.8rem;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.4rem;
    background: $blue-gradient;
    color: $background-dark;
    border: none;
    border-radius: 50px;
    font-family: 'Rubik', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(0, 195, 245, 0.3);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(0, 195, 245, 0.45);
    }

    &:active {
      transform: translateY(-1px);
    }
  }
}

@keyframes calcSpin {
  to { transform: rotate(360deg); }
}
</style>