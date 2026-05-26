<!-- app/components/ui/calculator/shared/SectionTabs.vue -->
<template>
  <div class="section-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="tab-btn"
      :class="{ 'is-active': modelValue === tab.id }"
      @click="selectTab(tab.id)"
    >
      <Icon :name="tab.icon" size="20" class="tab-icon" />
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CalculatorSection } from '~/types/calculator'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  modelValue: CalculatorSection
}>()

const emit = defineEmits<{
  'update:modelValue': [value: CalculatorSection]
}>()

// -----------------------------------------------------------------------------
// 2. Конфигурация вкладок
// -----------------------------------------------------------------------------
const tabs = [
  { id: 'walls', label: 'Стены', icon: 'mdi:wall' },
  { id: 'floor', label: 'Пол', icon: 'material-symbols:floor' },
  { id: 'ceiling', label: 'Потолок', icon: 'material-symbols:roofing' }
] as const

// -----------------------------------------------------------------------------
// 3. Логика
// -----------------------------------------------------------------------------
function selectTab(id: CalculatorSection) {
  if (props.modelValue === id) return
  
  emit('update:modelValue', id)
  console.log(`🔄 Переключение секции: ${id}`)
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.section-tabs {
  display: flex;
  background: $bg-light;
  padding: 4px;
  border-radius: 10px;
  gap: 4px;
  margin-bottom: $spacing-md;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  color: $text-secondary;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:hover:not(.is-active) {
    background: rgba($primary, 0.05);
    color: $text-primary;
  }

  &.is-active {
    background: $bg-white;
    color: $primary;
    box-shadow: 0 2px 8px rgba($primary, 0.1);
    
    .tab-icon {
      transform: scale(1.1);
    }
  }

  .tab-icon {
    transition: transform 0.2s;
  }
}

span {
  color: unset;
}
</style>