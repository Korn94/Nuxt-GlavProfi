<!-- app/components/ui/calculator/blocks/BlockSummary.vue -->
<template>
  <div class="block-summary">
    <div class="summary-content">
      
      <div class="total-section">
        <span class="label">Итоговая стоимость работ:</span>
        <span class="price">{{ formatPrice(total) }} ₽</span>
        
        <div v-if="pricePerM2 > 0" class="per-m2-badge">
          ≈ {{ formatPrice(pricePerM2) }} ₽/м²
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn-submit" @click="emit('submit-lead')" :disabled="total === 0">
          <Icon name="material-symbols:send" size="20" />
          Получить точную смету
        </button>
      </div>
      
      <p class="disclaimer">
        ⚠️ Расчёт является предварительным. Точная стоимость определяется после замера.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CalculationResult } from '~/types/calculator'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  result: CalculationResult
  area: number
}>()

const emit = defineEmits<{
  (e: 'submit-lead'): void
}>()

// -----------------------------------------------------------------------------
// 2. Вычисления
// -----------------------------------------------------------------------------

const total = computed(() => props.result.summary.grandTotal)

const pricePerM2 = computed(() => {
  if (props.area > 0 && total.value > 0) {
    return Math.round(total.value / props.area)
  }
  return 0
})

// -----------------------------------------------------------------------------
// 3. Утилиты
// -----------------------------------------------------------------------------
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.block-summary {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 12px;
  padding: $spacing-lg;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  margin-top: $spacing-lg;
  
  @include mobile {
    padding: $spacing-md;
  }
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;
  text-align: center;
}

.total-section {
  .label {
    display: block;
    font-size: 0.95rem;
    color: $text-secondary;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .price {
    display: block;
    font-size: 2.5rem;
    font-weight: 800;
    color: $primary;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  
  .per-m2-badge {
    margin-top: 8px;
    font-size: 0.85rem;
    color: $text-primary;
    background: $bg-light;
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid $border-color;
  }
}

.actions {
  display: flex;
  justify-content: center;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: $success;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 320px;
  box-shadow: 0 4px 12px rgba($success, 0.3);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba($success, 0.4);
  }

  &:disabled {
    background: $border-light;
    color: $text-muted;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

.disclaimer {
  font-size: 0.75rem;
  color: $text-muted;
  margin: 0;
  line-height: 1.4;
  padding-top: 4px;
  border-top: 1px dashed $border-light;
}

span {
  color: unset;
}
</style>