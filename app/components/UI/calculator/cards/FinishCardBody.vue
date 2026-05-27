<!-- app/components/ui/calculator/cards/FinishCardBody.vue -->
<template>
  <div class="card-body">
    <!-- 1. Панель настроек (Опции) -->
    <Transition name="slide">
      <div v-if="isOptionsVisible && optionsConfig" class="options-panel">
        <div v-for="(opt, key) in optionsConfig" :key="key" class="option-row">
          <label class="option-label">{{ opt.label }}:</label>
          <select
            :value="instance.options[key]"
            @change="onOptionChange(key, $event)"
            class="option-select"
          >
            <option v-for="val in opt.values" :key="val.value" :value="val.value">
              {{ val.label }}
            </option>
          </select>
        </div>
      </div>
    </Transition>

    <!-- 2. Базовые работы (Состав) -->
    <section class="works-section">
      <h5 class="section-title">Состав работ (база)</h5>
      <ul class="works-list">
        <li v-for="work in baseWorks" :key="work.id" class="work-item">
          <p class="work-name">{{ work.name }}</p>
          <span class="work-detail">
            {{ formatPrice(work.pricePerUnit) }} ₽/м² × {{ instance.area.toFixed(1) }} м²
          </span>
          <span class="work-total">{{ formatPrice(work.pricePerUnit * instance.area) }} ₽</span>
        </li>
        <li v-if="baseWorks.length === 0" class="work-item empty">
          Базовые работы не найдены в прайсе.
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { 
  SurfaceInstance, 
  NormalizedWorkItem, 
  FinishOptionConfig 
} from '~/types/calculator'

// -----------------------------------------------------------------------------
// 1. Props & Emits
// -----------------------------------------------------------------------------
const props = defineProps<{
  instance: SurfaceInstance
  baseWorks: NormalizedWorkItem[]
  isOptionsVisible: boolean
  optionsConfig?: Record<string, FinishOptionConfig>
}>()

const emit = defineEmits<{
  'update-option': [payload: { instanceId: string; optionKey: string; value: string }]
}>()

// -----------------------------------------------------------------------------
// 2. Логика
// -----------------------------------------------------------------------------
function onOptionChange(key: string, event: Event) {
  const val = (event.target as HTMLSelectElement).value
  emit('update-option', { 
    instanceId: props.instance.instanceId, 
    optionKey: key, 
    value: val 
  })
}

// -----------------------------------------------------------------------------
// 3. Утилиты
// -----------------------------------------------------------------------------
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(price))
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// === Тело карточки ===
.card-body {
  padding: 1.2rem;
}

// === Панель опций ===
.options-panel {
  padding: 1rem 1.2rem;
  background: rgba(0, 195, 245, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  margin-bottom: 1.2rem;
  border-radius: 8px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.6rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.option-label {
  font-size: 0.85rem;
  color: rgba($text-light, 0.6);
  min-width: 110px;
  font-family: 'Rubik', sans-serif;
  flex-shrink: 0;
}

.option-select {
  flex: 1;
  padding: 0.5rem 0.8rem;
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: 'Rubik', sans-serif;
  background: rgba(255, 255, 255, 0.04);
  color: $text-light;
  transition: all 0.25s ease;
  cursor: pointer;

  // Стилизация стрелки select для тёмной темы
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24'%3E%3Cpath fill='%2300c3f5' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 2rem;

  &:focus {
    outline: none;
    border-color: $blue;
    background-color: rgba(0, 195, 245, 0.06);
    box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
  }

  // Опции внутри dropdown (зависит от ОС, но фон стараемся задать)
  option {
    background: #2a2b2e;
    color: $text-light;
  }
}

// === Секция базовых работ ===
.works-section {
  margin-bottom: 1.5rem;
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

.works-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.work-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 0.88rem;
  background: rgba(255, 255, 255, 0.02);
  transition: background 0.2s ease;

  &:last-child {
    border-bottom: none;
  }

  &.empty {
    color: rgba($text-light, 0.4);
    font-style: italic;
    justify-content: center;
    padding: 1.2rem;
  }
}

.work-name {
  flex: 1;
  font-weight: 500;
  color: rgba($text-light, 0.9);
  line-height: 1.35;
  font-family: 'Rubik', sans-serif;
  min-width: 0;
}

.work-detail {
  color: rgba($text-light, 0.5);
  white-space: nowrap;
  font-size: 0.82rem;
  font-family: 'Rubik', sans-serif;
}

.work-total {
  font-weight: 700;
  color: $blue-light;
  white-space: nowrap;
  font-family: 'Rubik', sans-serif;
}

// === Анимация раскрытия опций ===
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

// === Адаптив ===
@media (max-width: 640px) {
  .option-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .option-label {
    min-width: unset;
  }

  .option-select {
    width: 100%;
  }

  .work-item {
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .work-name {
    flex-basis: 100%;
  }

  .work-detail {
    font-size: 0.78rem;
  }
}
</style>