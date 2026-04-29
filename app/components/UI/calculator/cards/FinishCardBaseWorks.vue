<!-- app/components/ui/calculator/cards/FinishCardBaseWorks.vue -->
<template>
  <section class="works-section">
    <h5 class="section-title">Состав работ (база)</h5>
    <ul class="works-list">
      <li v-for="work in works" :key="work.id" class="work-item" :class="{ 'is-excluded': isExcluded(work.id) }">
        <div class="work-info">
          <label class="work-checkbox-wrapper">
            <input 
              type="checkbox" 
              :checked="!isExcluded(work.id)" 
              @change="emit('toggle-exclude', work.id)"
              class="work-checkbox"
            >
            <span class="checkbox-custom"></span>
          </label>
          <span class="work-name">{{ work.name }}</span>
        </div>
        
        <div class="work-calc">
          <span class="work-unit">{{ formatPrice(work.pricePerUnit) }} ₽/м²</span>
          <span class="work-sep">×</span>
          <span class="work-qty">{{ quantity.toFixed(1) }} м²</span>
          <span class="work-sep">=</span>
          <span class="work-total">{{ formatPrice(work.pricePerUnit * quantity) }} ₽</span>
        </div>
      </li>
      <li v-if="works.length === 0" class="work-item empty">
        Базовые работы не найдены в прайсе.
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { NormalizedWorkItem } from '~/types/calculator'

const props = defineProps<{
  works: NormalizedWorkItem[]
  quantity: number
  excludedIds: number[]
}>()

const emit = defineEmits<{
  'toggle-exclude': [itemId: number]
}>()

function isExcluded(id: number) {
  return props.excludedIds.includes(id)
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.works-section { margin: 0; }
.section-title {
  margin: 0 0 10px; font-size: 0.85rem; font-weight: 600;
  color: $text-primary; text-transform: uppercase; letter-spacing: 0.5px;
}

.works-list {
  list-style: none; margin: 0; padding: 0;
  border: 1px solid $border-light; border-radius: 8px; overflow: hidden;
}

.work-item {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 10px 14px; border-bottom: 1px solid $border-light;
  font-size: 0.85rem; background: $bg-white;
  &:last-child { border-bottom: none; }
  &.empty { color: $text-muted; font-style: italic; justify-content: center; }
  
  &.is-excluded {
    opacity: 0.5; background: $bg-light;
    .work-name { text-decoration: line-through; }
    .work-calc { color: $text-muted; }
  }
}

.work-info { display: flex; align-items: center; gap: 10px; flex: 1; }
.work-name { font-weight: 500; color: $text-primary; line-height: 1.3; }

// Чекбокс
.work-checkbox-wrapper {
  position: relative; display: inline-flex; align-items: center; cursor: pointer;
  .work-checkbox { position: absolute; opacity: 0; }
  .checkbox-custom {
    width: 16px; height: 16px; border: 2px solid $border-color; border-radius: 4px;
    transition: all 0.2s; display: flex; align-items: center; justify-content: center;
    background: $bg-white;
  }
  &:hover .checkbox-custom { border-color: $primary; }
  .work-checkbox:checked + .checkbox-custom {
    background: $primary; border-color: $primary;
    &::after {
      content: '✓'; color: white; font-size: 10px; font-weight: bold;
    }
  }
}

.work-calc {
  display: flex; align-items: center; gap: 4px; white-space: nowrap;
  color: $text-secondary; font-size: 0.8rem;
  .work-total { font-weight: 700; color: $primary; font-size: 0.9rem; margin-left: 4px; }
}

span {
  color: unset;
}
</style>