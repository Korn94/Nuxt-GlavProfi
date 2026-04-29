<!-- app/components/ui/calculator/index.vue -->
<template>
  <div class="calculator-wrapper" :class="{ 'is-loading': pending }">
    
    <h2 class="calc-title">Калькулятор ремонта</h2>

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
    <div v-if="pending" class="calc-loader">
      <Icon name="material-symbols:progress-activity" size="32" class="spinner" />
      <p>Загружаем актуальные цены...</p>
    </div>

    <!-- 4. Основной контент -->
    <template v-else-if="sections">
      
      <!-- Блок 1: Демонтаж и подготовка -->
      <BlockDemolition
        :available-items="demolitionItems" 
        :selected-works="state.demolitionWorks"
        @add="addDemolitionWork"
        @remove="removeDemolitionWork"
        @update-qty="updateDemolitionQty"
      />

      <!-- Блок 2: Чистовые покрытия -->
      <BlockFinishes
        :available-groups="availableGroups"
        :surface-instances="state.surfaceInstances"
        :all-works="allWorksFlat"
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
        @add="addPieceWork"
        @remove="removePieceWork"
        @update-qty="updatePieceQty"
      />

      <!-- Блок 4: Итог и заявка -->
      <BlockSummary
        :result="result"
        :area="state.dimensions.floorArea"
        @submit-lead="handleLeadSubmit"
      />

    </template>

    <!-- 5. Ошибка загрузки -->
    <div v-else-if="error" class="calc-error">
      <p>❌ Не удалось загрузить прайс-лист.</p>
      <button @click="refresh()">Попробовать снова</button>
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

// ✅ НОВЫЙ: Стабильный список всех штучных/погонных работ из ВСЕХ разделов
const allPieceWorks = computed(() => 
  allWorksFlat.value.filter(w => w.normalizedUnit === 'piece' || w.normalizedUnit === 'linear')
)

// ✅ ИСПРАВЛЕНО: Демонтаж берётся из общего пула, а не только из текущей вкладки
const demolitionItems = computed(() => 
  allWorksFlat.value.filter(w => w.isDemolition)
)

// -----------------------------------------------------------------------------
// 3. Адаптеры для допов внутри карточки
// -----------------------------------------------------------------------------
function addInstanceExtra(instanceId: string, itemId: number) {
  const inst = state.surfaceInstances.find(i => i.instanceId === instanceId)
  if (inst && !inst.extras.some(e => e.itemId === itemId)) {
    inst.extras.push({ itemId, qty: 1 })
    console.log(`➕ Доп. работа добавлена к инстансу ${instanceId}: ${itemId}`)
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

// -----------------------------------------------------------------------------
// 4. Обработка заявки
// -----------------------------------------------------------------------------
function handleLeadSubmit() {
  console.log('📤 Отправка лида:', {
    input: state,
    result: result.value,
    timestamp: Date.now()
  })
  
  alert('Заявка успешно сформирована! (см. консоль)')
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

span {
  color: unset;
}

.calculator-wrapper {
  background: $bg-white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  overflow: hidden;
  font-family: inherit;
  padding: $spacing-lg;
  
  &.is-loading {
    pointer-events: none;
    opacity: 0.7;
  }
}

.calc-title {
  margin: 0 0 $spacing-lg;
  font-size: 1.5rem;
  font-weight: 700;
  color: $text-primary;
  text-align: center;
}

.calc-dimensions { margin-bottom: $spacing-lg; }
.calc-tabs { margin-bottom: $spacing-md; }

.calc-loader, .calc-error {
  padding: 40px;
  text-align: center;
  color: $text-secondary;
  
  .spinner { animation: spin 1s linear infinite; margin-bottom: 8px; }
  button {
    margin-top: 12px;
    padding: 8px 16px;
    border: 1px solid $primary;
    color: $primary;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    &:hover { background: rgba($primary, 0.05); }
  }
}

@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: $breakpoint-md) {
  .calculator-wrapper { padding: $spacing-md; border-radius: 0; box-shadow: none; }
  .calc-title { font-size: 1.25rem; }
}
</style>