<!-- app/components/ui/calculator/blocks/BlockSummary.vue -->
<template>
  <div class="block-summary">
    <div class="summary-content">
      <!-- === Итоговая сумма === -->
      <div class="total-section">
        <span class="label">Итоговая стоимость работ:</span>
        <span class="price">{{ formatPrice(total) }} ₽</span>
        <div v-if="pricePerM2 > 0" class="per-m2-badge">
          ≈ {{ formatPrice(pricePerM2) }} ₽/м²
        </div>
      </div>
      <!-- === Кнопка открытия модалки === -->
      <div class="actions">
        <button
          type="button"
          class="btn-submit"
          :disabled="!isClientReady || total <= 0"
          @click="isModalOpen = true"
        >
          <Icon name="mdi:send" size="20" />
          Получить точную смету
        </button>
      </div>
      <!-- === Уведомление после успешной отправки === -->
      <Transition name="fade">
        <div v-if="showSuccessBanner" class="success-banner">
          <Icon name="mdi:check-circle" size="22" class="success-banner__icon" />
          <div class="success-banner__text">
            <strong>Заявка отправлена!</strong>
            <p>Инженер свяжется с вами в течение 24 часов.</p>
          </div>
        </div>
      </Transition>
      <p class="disclaimer">
        <Icon name="mdi:information-outline" size="14" class="disclaimer__icon" />
        Расчёт является предварительным. Точная стоимость определяется после замера.
      </p>
    </div>
    <!-- === Модальное окно === -->
    <LeadModal
      v-model:is-open="isModalOpen"
      :result="result"
      :area="area"
      :calculator-state="calculatorState"
      :all-works="allWorks"
      :source-label="sourceLabel"
      @success="onSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import type { CalculationResult, CalculatorState, WorkUnit } from '~/types/calculator'
import LeadModal from '../modals/LeadModal.vue'

// -----------------------------------------------------------------------------
// 1. Props
// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    result: CalculationResult
    area: number
    calculatorState: CalculatorState
    allWorks: Array<{ id: number; name: string; pricePerUnit: number; normalizedUnit: WorkUnit }>
    sourceLabel?: string
  }>(),
  {
    sourceLabel: 'Калькулятор ремонта',
  }
)

// -----------------------------------------------------------------------------
// 2. Состояние
// -----------------------------------------------------------------------------
const isModalOpen = ref(false)
const showSuccessBanner = ref(false)
const isClientReady = ref(false) // ✅ Для предотвращения hydration mismatch

// -----------------------------------------------------------------------------
// 3. Вычисления
// -----------------------------------------------------------------------------
const total = computed(() => {
  // ✅ Защита от undefined на сервере
  const value = props.result?.summary?.grandTotal
  return typeof value === 'number' ? value : 0
})

const pricePerM2 = computed(() => {
  if (props.area > 0 && total.value > 0) {
    return Math.round(total.value / props.area)
  }
  return 0
})

// -----------------------------------------------------------------------------
// 4. Утилиты
// -----------------------------------------------------------------------------
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}

// -----------------------------------------------------------------------------
// 5. Обработка успеха
// -----------------------------------------------------------------------------
function onSuccess() {
  showSuccessBanner.value = true
  setTimeout(() => {
    showSuccessBanner.value = false
  }, 8000)
}

// -----------------------------------------------------------------------------
// 6. Жизненный цикл
// -----------------------------------------------------------------------------
onMounted(() => {
  // ✅ Отложенная активация для синхронизации с серверным рендером
  isClientReady.value = true
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// === Контейнер итогового блока ===
.block-summary {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(0, 195, 245, 0.2);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  margin-top: 2rem;
  /* position: relative; */
  /* z-index: 1; */
  overflow: clip;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: $blue-gradient;
  }

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

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 1.8rem;
  text-align: center;
  position: relative;
  z-index: 1;
}

// === Итоговая сумма ===
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

// === Кнопка ===
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

// === Баннер успеха ===
.success-banner {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  background: rgba($green, 0.1);
  border: 1px solid rgba($green, 0.3);
  border-radius: 12px;
  max-width: 460px;
  margin: 0 auto;
  width: 100%;

  &__icon {
    color: $green;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    text-align: left;

    strong {
      color: #4ade80;
      font-weight: 600;
      font-size: 0.95rem;
    }

    span {
      color: rgba($text-light, 0.75);
      font-size: 0.85rem;
    }
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

// === Анимации ===
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>