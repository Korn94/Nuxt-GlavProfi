<!-- app/components/ui/calculator/blocks/BlockFinishes.vue -->
<template>
  <div class="block-finishes">
    <header class="block-header">
      <h3 class="block-title">
        <Icon name="mdi:palette-outline" size="22" class="block-title__icon" />
        Чистовая отделка (комплекс работ)
        <span class="section-badge">
          <Icon :name="sectionMeta.icon" size="16" />
          {{ sectionMeta.label }}
        </span>
      </h3>
      <p class="block-desc">Нажмите на покрытие из списка, чтобы сразу добавить его в смету.</p>
    </header>

    <!-- 1. Поиск и мгновенное добавление (показывает только работы текущей секции) -->
    <div class="add-row">
      <WorkSearchSelect
        :model-value="null"
        :items="groupSelectItems"
        placeholder="+ Нажмите, чтобы выбрать и добавить покрытие..."
        :exclude-item-ids="surfaceInstances.map(i => i.finishGroupId)"
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
        :dimensions="props.dimensions"
        :section="props.section"
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
import { FINISH_GROUPS } from '~/utils/finish-groups'
import WorkSearchSelect from '~/components/ui/calculator/shared/WorkSearchSelect.vue'
import FinishCard from '~/components/ui/calculator/cards/FinishCard.vue'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  availableGroups: FinishGroupConfig[]
  surfaceInstances: SurfaceInstance[]
  allWorks: NormalizedWorkItem[]
  section: CalculatorSection
  dimensions: { floorArea: number; height: number; perimeter: number | null; wallArea: number | null } // ✅ ДОБАВЛЕНО
}>()

const SECTION_META: Record<CalculatorSection, { label: string; icon: string }> = {
  walls:   { label: 'стены',    icon: 'mdi:wall' },
  floor:   { label: 'пол',      icon: 'material-symbols:floor' },
  ceiling: { label: 'потолок',  icon: 'material-symbols:roofing' },
  partitions: { label: 'перегородки',  icon: 'material-symbols:elevation-outline' },
}

const sectionMeta = computed(() => SECTION_META[props.section] || SECTION_META.walls)

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
 * Динамически рассчитываем базовую цену за м².
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
      pricePerUnit: Math.round(basePrice),
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
    // console.log('✅ Добавлено новое покрытие:', found.groupId)
  }
}

/** Ищем конфиг во всех группах, чтобы карточки не пустели при переключении вкладок */
function getGroupConfig(id: string): FinishGroupConfig | undefined {
  return FINISH_GROUPS[id]
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// === Контейнер блока (тёмная карточка) ===
.block-finishes {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 1.8rem;
  margin-bottom: 1.5rem;
  /* position: relative; */
  /* z-index: 1; */
}

// === Заголовок блока ===
.block-header {
  margin-bottom: 1.5rem;
}

.block-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 0.4rem;
  font-family: 'Rubik', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  color: $text-light;
  line-height: 1.3;

  &__icon {
    color: $blue-light;
    flex-shrink: 0;
  }
}

.block-desc {
  margin: 0;
  font-size: 0.88rem;
  color: rgba($text-light, 0.6);
  line-height: 1.5;
}

// === Строка поиска ===
.add-row {
  margin-bottom: 1.5rem;
}

.select-wrapper {
  width: 100%;
}

// === Список инстансов ===
.finishes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

// === Пустое состояние ===
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  color: rgba($text-light, 0.4);
  font-size: 0.92rem;
  text-align: center;
  gap: 0.8rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.08);
  border-radius: 12px;

  .empty-icon {
    opacity: 0.35;
    color: rgba($text-light, 0.5);
  }

  p {
    color: $text-gray;
    margin: 0;
    line-height: 1.5;
  }
}

// === Анимации списка ===
.list-enter-active {
  transition: all 0.3s ease-out;
}

.list-leave-active {
  transition: all 0.2s ease-in;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.list-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.list-move {
  transition: transform 0.3s ease;
}

// === Бейдж текущей секции в заголовке ===
.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  margin-left: 0.5rem;
  padding: 0.2rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: $blue-light;
  background: rgba(0, 195, 245, 0.12);
  border: 1px solid rgba(0, 195, 245, 0.25);
  border-radius: 50px;
  text-transform: lowercase;
  font-family: 'Rubik', sans-serif;
  letter-spacing: 0.02em;
  vertical-align: middle;
  transition: all 0.25s ease;
}

// Плавная смена при переключении секции
.block-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}
</style>