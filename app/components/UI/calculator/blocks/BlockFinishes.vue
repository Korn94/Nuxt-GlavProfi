<!-- app/components/ui/calculator/blocks/BlockFinishes.vue -->
<template>
  <div class="block-finishes">
    <header class="block-header">
      <h3 class="block-title">🎨 Чистовые покрытия</h3>
      <p class="block-desc">Нажмите на покрытие из списка, чтобы сразу добавить его в смету.</p>
    </header>

    <!-- 1. Поиск и мгновенное добавление (показывает только работы текущей секции) -->
    <div class="add-row">
      <WorkSearchSelect
        :model-value="null"
        :items="groupSelectItems"
        placeholder="+ Нажмите, чтобы выбрать и добавить покрытие..."
        class="select-wrapper"
        @select="handleSelectGroup"
      />
    </div>

    <!-- 2. Список активных покрытий (отображает ВСЕ добавленные, независимо от вкладки) -->
    <TransitionGroup name="list" tag="div" class="finishes-list">
      <FinishCard
        v-for="instance in surfaceInstances"
        :key="instance.instanceId"
        :instance="instance"
        :config="getGroupConfig(instance.finishGroupId)"
        :all-works="allWorks"
        :extras="instance.extras || []"
        @remove="(id) => emit('remove', id)"
        @update-area="emit('update-area', $event)"
        @update-option="emit('update-option', $event)"
        @toggle-exclusion="emit('toggle-exclusion', $event)"
        @add-extra="(payload) => emit('add-extra', payload)"
        @remove-extra="(payload) => emit('remove-extra', payload)"
        @update-extra-qty="(payload) => emit('update-extra-qty', payload)"
      />
    </TransitionGroup>

    <!-- 3. Пустое состояние -->
    <div v-if="!surfaceInstances.length" class="empty-state">
      <Icon name="material-symbols:palette-outline" size="48" class="empty-icon" />
      <p>Пока не выбрано ни одного покрытия.<br>Используйте список выше для добавления.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { 
  FinishGroupConfig, 
  SurfaceInstance, 
  NormalizedWorkItem, 
  CalculatorSection, 
  WorkUnit 
} from '~/types/calculator'
import { FINISH_GROUPS } from '~/utils/finish-groups' // ✅ Импорт полной конфигурации
import WorkSearchSelect from '~/components/ui/calculator/shared/WorkSearchSelect.vue'
import FinishCard from '~/components/ui/calculator/cards/FinishCard.vue'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  availableGroups: FinishGroupConfig[]
  surfaceInstances: SurfaceInstance[]
  allWorks: NormalizedWorkItem[]
}>()

const emit = defineEmits<{
  'add': [groupId: string]
  'remove': [instanceId: string]
  'update-area': [payload: { instanceId: string, area: number }]
  'update-option': [payload: { instanceId: string, optionKey: string, value: string }]
  'toggle-exclusion': [payload: { instanceId: string, itemId: number }]
  'add-extra': [payload: { instanceId: string, itemId: number }]
  'remove-extra': [payload: { instanceId: string, itemId: number }]
  'update-extra-qty': [payload: { instanceId: string, itemId: number, qty: number }]
}>()

// -----------------------------------------------------------------------------
// 2. Адаптер для WorkSearchSelect
// -----------------------------------------------------------------------------

/** Интерфейс опции селекта, совместимый с NormalizedWorkItem */
interface GroupSelectItem {
  id: number
  groupId: string
  name: string
  icon?: string
  pricePerUnit: number
  normalizedUnit: WorkUnit
  subCategoryId: number
  section: CalculatorSection
}

/** 
 * ✅ Обновлено: динамически рассчитываем базовую цену за м².
 * Суммируем цены всех работ из baseItemIds конфига.
 */
const groupSelectItems = computed<GroupSelectItem[]>(() => 
  props.availableGroups.map((g, index) => {
    let basePrice = 0
    if (g.baseItemIds?.length && props.allWorks.length) {
      for (const id of g.baseItemIds) {
        const work = props.allWorks.find(w => w.id === id)
        if (work) basePrice += work.pricePerUnit
      }
    }

    return {
      id: index + 5000,
      groupId: g.id,
      name: `${g.icon || '🔹'} ${g.name}`,
      icon: g.icon,
      pricePerUnit: Math.round(basePrice), // ✅ Теперь здесь реальная цена за м²
      normalizedUnit: 'm2' as WorkUnit,
      subCategoryId: 0,
      section: g.section
    }
  })
)

// -----------------------------------------------------------------------------
// 3. Логика
// -----------------------------------------------------------------------------

function handleSelectGroup(numericId: number) {
  const found = groupSelectItems.value.find(i => i.id === numericId)
  if (found?.groupId) {
    emit('add', found.groupId)
    console.log('✅ Добавлено новое покрытие:', found.groupId)
  }
}

/** Ищем конфиг во всех группах, чтобы карточки не пустели при переключении вкладок */
function getGroupConfig(id: string): FinishGroupConfig | undefined {
  return FINISH_GROUPS[id]
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.block-finishes {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: $spacing-md;
  margin-bottom: $spacing-md;
}

.block-header { margin-bottom: $spacing-md; }
.block-title { margin: 0 0 4px; font-size: 1.1rem; font-weight: 600; color: $text-primary; }
.block-desc { margin: 0; font-size: 0.85rem; color: $text-secondary; line-height: 1.4; }

.add-row { margin-bottom: $spacing-md; }
.select-wrapper { width: 100%; }

// Список инстансов
.finishes-list { display: flex; flex-direction: column; gap: 16px; margin-bottom: $spacing-md; }

// Пустое состояние
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 32px 0; color: $text-muted; font-size: 0.9rem; text-align: center; gap: 8px;
  .empty-icon { opacity: 0.4; }
}

// Анимации списка
.list-enter-active { transition: all 0.3s ease-out; }
.list-leave-active { transition: all 0.2s ease-in; }
.list-enter-from { opacity: 0; transform: translateY(-12px); }
.list-leave-to { opacity: 0; transform: scale(0.98); }

span {
  color: unset;
}
</style>