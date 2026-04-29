<!-- app/components/ui/calculator/cards/FinishCard.vue -->
<template>
  <div class="finish-card">
    <FinishCardHeader
      :config="config"
      :instance="instance"
      :show-extras="showExtras"
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
  NormalizedWorkItem 
} from '~/types/calculator'
import FinishCardHeader from './FinishCardHeader.vue'
import FinishCardOptions from './FinishCardOptions.vue'
import FinishCardBaseWorks from './FinishCardBaseWorks.vue'
import FinishCardExtras from './FinishCardExtras.vue'

const props = defineProps<{
  instance: SurfaceInstance
  config: FinishGroupConfig | undefined
  allWorks: NormalizedWorkItem[]
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

// Состояние раскрытия допов (по умолчанию скрыты)
const showExtras = ref(false)

function onAreaUpdate(area: number) {
  emit('update-area', { instanceId: props.instance.instanceId, area })
}

function onToggleExclude(itemId: number) {
  emit('toggle-exclusion', { instanceId: props.instance.instanceId, itemId })
}

/** 
 * 🧮 Маппинг базовых работ с учётом опций.
 * ✅ Исправлено: опции заменяют только работы с совпадающим subCategoryId.
 */
const resolvedBaseWorks = computed(() => {
  if (!props.config || !props.config.baseItemIds?.length) return []

  // 1. Собираем все выбранные itemId из активных опций
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

  // 2. Формируем итоговый список
  const result: NormalizedWorkItem[] = []
  
  for (const baseId of props.config.baseItemIds) {
    const baseWork = props.allWorks.find(w => w.id === baseId)
    if (!baseWork) continue

    // Ищем замену: опция должна иметь тот же subCategoryId, что и базовая работа
    const replacementId = [...selectedOptionIds].find(optId => {
      const optWork = props.allWorks.find(w => w.id === optId)
      return optWork?.subCategoryId === baseWork.subCategoryId
    })

    const finalId = replacementId || baseWork.id
    const finalWork = props.allWorks.find(w => w.id === finalId)
    if (finalWork) result.push(finalWork)
  }

  console.log('🔍 Разрешение базовых работ для', props.config.name, ':', result.map(w => w.id))
  return result
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.finish-card {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.extras-section {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px dashed $border-color;
}

.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; max-height: 600px; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

span {
  color: unset;
}
</style>