<!-- app/components/ui/calculator/cards/FinishCard.vue -->
<template>
  <div class="finish-card">
    <FinishCardHeader
      :config="config"
      :instance="instance"
      :show-extras="showExtras"
      :total-price="cardTotal"
      :dimensions="dimensions"
      :section="section"
      @update-area="onAreaUpdate"
      @remove="emit('remove', instance.instanceId)"
      @toggle-extras="showExtras = !showExtras"
    />
    <div class="card-content">
      <!-- 1. Опции (всегда видны, radio) -->
      <FinishCardOptions
        v-if="config?.options"
        :options-config="config.options"
        :current-options="instance.options"
        :instance-id="instance.instanceId"
        @update-option="emit('update-option', $event)"
      />
      <!-- 2. Базовые работы (всегда видны, с итогами) -->
      <FinishCardBaseWorks
        :works="resolvedBaseWorks"
        :quantity="instance.area"
        :excluded-ids="instance.excludedItemIds"
        @toggle-exclude="onToggleExclude"
      />
      <!-- 3. Доп. работы (раскрываются по клику) -->
      <Transition name="slide">
        <div v-if="showExtras" class="extras-section">
          <FinishCardExtras
            :config="config"
            :all-works="allWorks"
            :extras="instance.extras || []"
            @add="(itemId) => emit('add-extra', { instanceId: instance.instanceId, itemId })"
            @remove="(itemId) => emit('remove-extra', { instanceId: instance.instanceId, itemId })"
            @update-qty="(itemId, qty) => emit('update-extra-qty', { instanceId: instance.instanceId, itemId, qty })"
          />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type {
  SurfaceInstance,
  FinishGroupConfig,
  NormalizedWorkItem,
  CalculatorSection
} from '~/types/calculator'
import FinishCardHeader from './FinishCardHeader.vue'
import FinishCardOptions from './FinishCardOptions.vue'
import FinishCardBaseWorks from './FinishCardBaseWorks.vue'
import FinishCardExtras from './FinishCardExtras.vue'

const props = defineProps<{
  instance: SurfaceInstance
  config: FinishGroupConfig | undefined
  allWorks: NormalizedWorkItem[]
  dimensions: { floorArea: number; height: number; perimeter: number | null; wallArea: number | null }
  section: CalculatorSection
}>()

const emit = defineEmits<{
  'remove': [instanceId: string]
  'update-area': [payload: { instanceId: string; area: number }]
  'update-option': [payload: { instanceId: string; optionKey: string; value: string }]
  'toggle-exclusion': [payload: { instanceId: string; itemId: number }]
  'add-extra': [payload: { instanceId: string; itemId: number }]
  'remove-extra': [payload: { instanceId: string; itemId: number }]
  'update-extra-qty': [payload: { instanceId: string; itemId: number; qty: number }]
}>()

const showExtras = ref(false)

function onAreaUpdate(area: number) {
  emit('update-area', { instanceId: props.instance.instanceId, area })
}

function onToggleExclude(itemId: number) {
  emit('toggle-exclusion', { instanceId: props.instance.instanceId, itemId })
}

// ✅ Расчёт итоговой стоимости карточки
const cardTotal = computed(() => {
  let total = 0
  // 1. Базовые работы (с учётом исключённых)
  for (const work of resolvedBaseWorks.value) {
    if (!props.instance.excludedItemIds?.includes(work.id)) {
      total += work.pricePerUnit * props.instance.area
    }
  }
  // 2. Дополнительные работы
  if (props.instance.extras?.length) {
    for (const extra of props.instance.extras) {
      const work = props.allWorks.find(w => w.id === extra.itemId)
      if (work) total += work.pricePerUnit * extra.qty
    }
  }
  return Math.round(total)
})

const resolvedBaseWorks = computed(() => {
  if (!props.config || !props.config.baseItemIds?.length) return []
  const selectedOptionIds = new Set<number>()
  if (props.config.options) {
    for (const optKey in props.instance.options) {
      const val = props.instance.options[optKey]
      const optGroup = props.config.options[optKey]
      if (optGroup) {
        const match = optGroup.values.find(v => v.value === val)
        if (match?.itemId) selectedOptionIds.add(match.itemId)
      }
    }
  }
  const replaceableBaseIds = props.config.baseItemIds.filter(baseId => {
    const baseWork = props.allWorks.find(w => w.id === baseId)
    if (!baseWork) return false
    const nameLower = baseWork.name.toLowerCase()
    return !nameLower.includes('грунтов') && !nameLower.includes('подготов')
  })
  const result: NormalizedWorkItem[] = []
  let replacementUsed = false
  for (const baseId of props.config.baseItemIds) {
    const baseWork = props.allWorks.find(w => w.id === baseId)
    if (!baseWork) continue
    const canReplace = replaceableBaseIds.includes(baseId) && !replacementUsed
    if (canReplace && selectedOptionIds.size > 0) {
      const replacementId = [...selectedOptionIds].find(optId => {
        const optWork = props.allWorks.find(w => w.id === optId)
        return optWork?.section === baseWork.section
      })
      if (replacementId) {
        const replacementWork = props.allWorks.find(w => w.id === replacementId)
        if (replacementWork) {
          result.push(replacementWork)
          replacementUsed = true
          continue
        }
      }
    }
    result.push(baseWork)
  }
  return result
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

.finish-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  &:hover {
    border-color: rgba(0, 195, 245, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  }
}
.card-content {
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}
.extras-section {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 800px;
  overflow: hidden;
}
.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>