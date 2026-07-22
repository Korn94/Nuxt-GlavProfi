<!-- app/components/pages/public/remontPomescheniy/pageTypes/workTypes/ui/PriceCalculatorTabs.vue -->
<template>
  <section class="price-calculator">
    <div class="container">
      <h2 class="price-calculator__title" v-html="title" />
      <p class="price-calculator__subtitle" v-if="subtitle">{{ subtitle }}</p>

      <!-- Табы -->
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tabs__btn"
          :class="{ 'tabs__btn--active': activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <Icon v-if="tab.icon" :name="tab.icon" size="18" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- Контент активного таба -->
      <div class="calculator-body">
        <!-- Состав работ -->
        <div class="calculator-works">
          <h3 class="calculator-works__title">Состав работ:</h3>
          <ul class="calculator-works__list">
            <li
              v-for="(work, index) in currentWorks"
              :key="index"
              class="calculator-works__item"
            >
              <Icon name="mdi:check-circle" size="18" class="work-icon" />
              <span class="work-name">{{ work.name }}</span>
              <span class="work-price">{{ work.price }} ₽/м²</span>
            </li>
          </ul>

          <!-- Итог -->
          <div class="calculator-total">
            <div class="calculator-total__label">Итого за м²:</div>
            <div class="calculator-total__value">
              <span class="price">{{ totalPerSqm }} ₽</span>
              <span class="note">без материалов</span>
            </div>
          </div>

          <!-- Доп. опции -->
          <div class="calculator-extras" v-if="currentExtras?.length">
            <h4>Дополнительно:</h4>
            <div class="extras-list">
              <label
                v-for="extra in currentExtras"
                :key="extra.id"
                class="extra-item"
              >
                <input
                  type="checkbox"
                  v-model="selectedExtras"
                  :value="extra.id"
                />
                <span class="extra-checkbox">
                  <Icon v-if="selectedExtras.includes(extra.id)" name="mdi:check" size="14" />
                </span>
                <span class="extra-name">{{ extra.name }}</span>
                <span class="extra-price">+{{ extra.price }} ₽/м²</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Правая колонка: калькулятор площади -->
        <aside class="calculator-side">
          <div class="side-card">
            <h3>Рассчитать для вашей площади</h3>
            <label class="side-label">
              Площадь помещения, м²
              <div class="side-input-wrap">
                <button @click="decreaseArea" :disabled="area <= minArea">
                  <Icon name="mdi:minus" size="18" />
                </button>
                <input
                  v-model.number="area"
                  type="number"
                  :min="minArea"
                  :max="maxArea"
                  @input="clampArea"
                />
                <button @click="increaseArea" :disabled="area >= maxArea">
                  <Icon name="mdi:plus" size="18" />
                </button>
              </div>
            </label>

            <div class="side-result">
              <span class="side-result__label">Предварительная стоимость:</span>
              <span class="side-result__value">{{ totalCost.toLocaleString('ru-RU') }} ₽</span>
              <span class="side-result__note">
                Точная цена — после бесплатного замера
              </span>
            </div>

            <button class="side-cta" @click="$emit('order-estimate')">
              <Icon name="mdi:send" size="18" />
              Вызвать замерщика
            </button>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

export interface WorkItem {
  name: string
  price: number
}
export interface ExtraItem {
  id: string
  name: string
  price: number
}
export interface CalculatorTab {
  id: string
  label: string
  icon?: string
  works: WorkItem[]
  extras?: ExtraItem[]
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    tabs: CalculatorTab[]
    defaultArea?: number
    minArea?: number
    maxArea?: number
    areaStep?: number
  }>(),
  {
    defaultArea: 20,
    minArea: 5,
    maxArea: 500,
    areaStep: 5,
  }
)

defineEmits(['order-estimate'])

const activeTab = ref(props.tabs[0]?.id || '')
const area = ref(props.defaultArea)
const selectedExtras = ref<string[]>([])

const currentTab = computed(() =>
  props.tabs.find((t) => t.id === activeTab.value) || props.tabs[0]
)
const currentWorks = computed(() => currentTab.value.works || [])
const currentExtras = computed(() => currentTab.value.extras || [])

const baseTotal = computed(() =>
  currentWorks.value.reduce((sum, w) => sum + w.price, 0)
)
const extrasTotal = computed(() =>
  selectedExtras.value.reduce((sum, id) => {
    const extra = currentExtras.value.find((e) => e.id === id)
    return sum + (extra?.price || 0)
  }, 0)
)
const totalPerSqm = computed(() => baseTotal.value + extrasTotal.value)
const totalCost = computed(() => totalPerSqm.value * area.value)

const clampArea = () => {
  if (area.value < props.minArea) area.value = props.minArea
  if (area.value > props.maxArea) area.value = props.maxArea
  if (!area.value) area.value = props.minArea
}
const increaseArea = () => {
  area.value = Math.min(props.maxArea, area.value + props.areaStep)
}
const decreaseArea = () => {
  area.value = Math.max(props.minArea, area.value - props.areaStep)
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables' as *;

.price-calculator {
  padding: 5rem 0;
  background: $background-light;

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
    @media (max-width: 768px) { padding: 0 1.2rem; }
  }

  &__title {
    font-family: 'Rubik', sans-serif;
    font-size: 2.2rem;
    font-weight: 700;
    color: $text-dark;
    margin: 0 0 0.8rem;
    line-height: 1.25;
    :deep(span) {
      background: $blue-gradient;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__subtitle {
    font-size: 1.05rem;
    line-height: 1.6;
    color: $text-gray;
    margin: 0 0 2rem;
    max-width: 720px;
  }
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid $border-color;
  flex-wrap: wrap;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.9rem 1.5rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: $text-gray;
    font-family: 'Rubik', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;

    &:hover { color: $blue; }

    &--active {
      color: $blue;
      border-bottom-color: $blue;
    }
  }
}

.calculator-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 2.5rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.calculator-works {
  &__title {
    font-size: 1.2rem;
    font-weight: 600;
    color: $text-dark;
    margin: 0 0 1rem;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 1rem;
    background: #f8f9fa;
    border-radius: $border-radius;
    margin-bottom: 0.5rem;
    transition: background 0.2s ease;

    &:hover { background: #f0f2f5; }

    .work-icon { color: $green; flex-shrink: 0; }
    .work-name {
      flex: 1;
      color: $text-dark;
      font-size: 0.98rem;
    }
    .work-price {
      font-weight: 700;
      color: $blue;
      font-size: 1rem;
      white-space: nowrap;
    }
  }
}

.calculator-total {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 195, 245, 0.08);
  border: 1px solid rgba(0, 195, 245, 0.25);
  border-left: 4px solid $blue;
  border-radius: $border-radius;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &__label {
    font-size: 1.05rem;
    color: $text-dark;
    font-weight: 500;
  }

  &__value {
    text-align: right;
    .price {
      display: block;
      font-family: 'Rubik', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: $blue;
      line-height: 1;
    }
    .note {
      display: block;
      font-size: 0.82rem;
      color: $text-gray;
      margin-top: 0.2rem;
    }
  }
}

.calculator-extras {
  margin-top: 1.5rem;

  h4 {
    font-size: 1rem;
    color: $text-dark;
    margin: 0 0 0.8rem;
  }
}

.extras-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.extra-item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.8rem 1rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: $border-radius;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover { border-color: $blue; }

  input { display: none; }

  .extra-checkbox {
    width: 20px;
    height: 20px;
    border: 1.5px solid $border-color;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    flex-shrink: 0;
  }

  input:checked + .extra-checkbox {
    background: $blue-gradient;
    border-color: transparent;
  }

  .extra-name { flex: 1; color: $text-dark; font-size: 0.95rem; }
  .extra-price { color: $text-gray; font-weight: 600; font-size: 0.9rem; }
}

.side-card {
  position: sticky;
  top: 120px;
  padding: 2rem;
  background: #fff;
  border: 1px solid $border-color;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);

  h3 {
    font-family: 'Rubik', sans-serif;
    font-size: 1.2rem;
    color: $text-dark;
    margin: 0 0 1.5rem;
  }
}

.side-label {
  display: block;
  font-size: 0.9rem;
  color: $text-gray;
  margin-bottom: 0.5rem;
}

.side-input-wrap {
  display: flex;
  align-items: stretch;
  background: #f8f9fa;
  border: 1.5px solid $border-color;
  border-radius: 10px;
  overflow: hidden;

  button {
    width: 42px;
    background: transparent;
    border: none;
    color: $blue;
    cursor: pointer;
    transition: background 0.2s ease;
    &:hover:not(:disabled) { background: rgba(0, 195, 245, 0.1); }
    &:disabled { opacity: 0.3; cursor: not-allowed; }
  }

  input {
    flex: 1;
    background: transparent;
    border: none;
    text-align: center;
    font-family: 'Rubik', sans-serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: $text-dark;
    outline: none;
    -moz-appearance: textfield;
    &::-webkit-outer-spin-button, &::-webkit-inner-spin-button {
      -webkit-appearance: none;
    }
  }
}

.side-result {
  margin: 1.5rem 0;
  padding: 1.2rem;
  background: rgba(0, 195, 245, 0.06);
  border-radius: 10px;
  text-align: center;

  &__label {
    display: block;
    font-size: 0.88rem;
    color: $text-gray;
    margin-bottom: 0.3rem;
  }
  &__value {
    display: block;
    font-family: 'Rubik', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    color: $blue;
    line-height: 1.1;
  }
  &__note {
    display: block;
    font-size: 0.78rem;
    color: $text-gray;
    margin-top: 0.3rem;
    font-style: italic;
  }
}

.side-cta {
  width: 100%;
  padding: 1rem;
  background: $blue-gradient;
  color: $background-dark;
  border: none;
  border-radius: 10px;
  font-family: 'Rubik', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-shadow: 0 6px 20px rgba(0, 195, 245, 0.35);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 28px rgba(0, 195, 245, 0.5);
  }
}
</style>