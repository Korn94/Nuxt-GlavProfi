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
  { id: 'ceiling', label: 'Потолок', icon: 'material-symbols:roofing' },
  { id: 'partitions', label: 'Перегородки', icon: 'material-symbols:elevation-outline' }
] as const

// -----------------------------------------------------------------------------
// 3. Логика
// -----------------------------------------------------------------------------
function selectTab(id: CalculatorSection) {
  if (props.modelValue === id) return
  
  emit('update:modelValue', id)
  // console.log(`🔄 Переключение секции: ${id}`)
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// === Контейнер табов (тёмная подложка) ===
.section-tabs {
  display: flex;
  background: rgba(255, 255, 255, 0.04);
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  z-index: 1;
}

// === Кнопка таба ===
.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  font-family: 'Rubik', sans-serif;
  font-weight: 500;
  font-size: 0.95rem;
  color: rgba($text-light, 0.6);
  transition: all 0.25s ease;

  // Hover для неактивных табов
  &:hover:not(.is-active) {
    background: rgba(0, 195, 245, 0.08);
    color: rgba($text-light, 0.9);
  }

  // Активный таб
  &.is-active {
    background: $blue-gradient;
    color: $background-dark;
    box-shadow: 0 4px 16px rgba(0, 195, 245, 0.3);
    
    .tab-icon {
      transform: scale(1.1);
      color: $background-dark;
    }

    .tab-label {
      font-weight: 600;
    }
  }

  .tab-icon {
    transition: transform 0.25s ease, color 0.25s ease;
    flex-shrink: 0;
  }

  .tab-label {
    white-space: nowrap;
    transition: font-weight 0.25s ease;
  }
}

// === Адаптив ===
@media (max-width: 640px) {
  .section-tabs {
    padding: 3px;
    gap: 3px;
  }

  .tab-btn {
    padding: 0.7rem 0.5rem;
    font-size: 0.85rem;
    gap: 0.35rem;

    // .tab-label {
      // На очень маленьких экранах можно скрыть текст и оставить только иконки
      // Но пока оставим текст, т.к. вкладки всего 3
    // }
  }
}

@media (max-width: 380px) {
  .tab-btn {
    .tab-label {
      display: none; // Экстремально узкие экраны — только иконки
    }

    .tab-icon {
      font-size: 1.3rem;
    }
  }
}
</style>