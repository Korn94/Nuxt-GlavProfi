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
          <p class="work-name">{{ work.name }}</p>
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
@use "@/assets/styles/variables" as *;

// === Секция базовых работ ===
.works-section {
  margin: 0;
}

.section-title {
  margin: 0 0 0.7rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba($text-light, 0.55);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-family: 'Rubik', sans-serif;
}

// === Список работ ===
.works-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

// === Строка работы ===
.work-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.88rem;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &.empty {
    color: rgba($text-light, 0.4);
    font-style: italic;
    justify-content: center;
    padding: 1.2rem;
  }

  &.is-excluded {
    opacity: 0.45;
    background: rgba(255, 255, 255, 0.01);

    .work-name {
      text-decoration: line-through;
      color: rgba($text-light, 0.5);
    }

    .work-calc {
      color: rgba($text-light, 0.3);
    }
  }
}

// === Информация о работе ===
.work-info {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 1;
  min-width: 0;
}

.work-name {
  font-weight: 500;
  color: rgba($text-light, 0.9);
  line-height: 1.35;
  font-family: 'Rubik', sans-serif;
}

// === Кастомный чекбокс ===
.work-checkbox-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;

  .work-checkbox {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .checkbox-custom {
    width: 18px;
    height: 18px;
    border: 1.5px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.04);
  }

  &:hover .checkbox-custom {
    border-color: $blue;
    background: rgba(0, 195, 245, 0.06);
  }

  .work-checkbox:checked + .checkbox-custom {
    background: $blue-gradient;
    border-color: transparent;

    &::after {
      content: '✓';
      color: $background-dark;
      font-size: 11px;
      font-weight: 800;
    }
  }

  // Focus-visible для accessibility
  .work-checkbox:focus-visible + .checkbox-custom {
    outline: 2px solid $blue;
    outline-offset: 2px;
  }
}

// === Расчёт стоимости ===
.work-calc {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  color: rgba($text-light, 0.5);
  font-size: 0.82rem;
  font-family: 'Rubik', sans-serif;
  flex-shrink: 0;

  .work-sep {
    color: rgba($text-light, 0.25);
  }

  .work-total {
    font-weight: 700;
    color: $blue-light;
    font-size: 0.9rem;
    margin-left: 0.3rem;
  }
}

// === Адаптив ===
@media (max-width: 640px) {
  .work-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    padding: 0.8rem 1rem;
  }

  .work-calc {
    padding-left: calc(18px + 0.7rem); // Отступ под чекбокс
  }
}
</style>