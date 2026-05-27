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
        <Icon name="mdi:information-outline" size="14" class="disclaimer__icon" />
        Расчёт является предварительным. Точная стоимость определяется после замера.
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
@use "@/assets/styles/variables" as *;

// === Контейнер итогового блока (тёмная карточка с акцентом) ===
.block-summary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  margin-top: 2rem;
  // position: relative;
  // z-index: 1;
  overflow: hidden;

  // Градиентная линия сверху (как в ApplicationCTA и главном wrapper)
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $blue-gradient;
  }

  // Декоративное свечение
  &::after {
    content: '';
    position: absolute;
    bottom: -40%;
    left: -20%;
    width: 350px;
    height: 350px;
    background: radial-gradient(
      circle,
      rgba(0, 195, 245, 0.08) 0%,
      transparent 70%
    );
    border-radius: 50%;
    pointer-events: none;
  }

  @media (max-width: 768px) {
    padding: 2rem 1.3rem;
  }
}

// === Контент ===
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  text-align: center;
  position: relative;
  z-index: 1;
}

// === Секция итоговой суммы ===
.total-section {
  .label {
    display: block;
    font-size: 1rem;
    color: rgba($text-light, 0.65);
    margin-bottom: 0.6rem;
    font-weight: 500;
    font-family: 'Rubik', sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .price {
    display: block;
    font-size: 3rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-family: 'Rubik', sans-serif;
    background: $blue-gradient;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;

    @media (max-width: 768px) {
      font-size: 2.2rem;
    }
  }

  .per-m2-badge {
    margin-top: 0.8rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: $blue-light;
    background: rgba(0, 195, 245, 0.1);
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 1rem;
    border-radius: 50px;
    border: 1px solid rgba(0, 195, 245, 0.25);
    font-family: 'Rubik', sans-serif;
  }
}

// === Кнопка отправки ===
.actions {
  display: flex;
  justify-content: center;
}

.btn-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: $blue-gradient;
  color: $background-dark;
  border: none;
  padding: 1.1rem 2.5rem;
  border-radius: 50px;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'Rubik', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 8px 24px rgba(0, 195, 245, 0.35);

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 14px 32px rgba(0, 195, 245, 0.5);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    background: rgba(255, 255, 255, 0.08);
    color: rgba($text-light, 0.35);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
}

// === Дисклеймер ===
.disclaimer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: rgba($text-light, 0.45);
  margin: 0;
  line-height: 1.5;
  padding-top: 1rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.1);
  font-family: 'Rubik', sans-serif;

  &__icon {
    flex-shrink: 0;
    opacity: 0.7;
  }
}
</style>