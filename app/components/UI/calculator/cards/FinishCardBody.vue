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
          <span class="work-name">{{ work.name }}</span>
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
@use "@/assets/styles/calculator-vars.scss" as *;

.card-body { padding: 16px; }

// Опции
.options-panel {
  padding: 12px 16px;
  background: rgba($primary, 0.03);
  border-bottom: 1px solid $border-light;
  margin-bottom: 16px;
}

.option-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  &:last-child { margin-bottom: 0; }
}

.option-label {
  font-size: 0.85rem;
  color: $text-secondary;
  min-width: 100px;
}

.option-select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid $border-color;
  border-radius: 6px;
  font-size: 0.9rem;
  background: $bg-white;
  &:focus { border-color: $primary; outline: none; }
}

// Список базовых работ
.works-section { margin-bottom: 20px; }
.section-title {
  margin: 0 0 10px;
  font-size: 0.9rem;
  font-weight: 600;
  color: $text-primary;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.works-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid $border-light;
  border-radius: 8px;
  overflow: hidden;
}

.work-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 1px solid $border-light;
  font-size: 0.85rem;
  background: $bg-white;

  &:last-child { border-bottom: none; }
  &.empty { color: $text-muted; font-style: italic; justify-content: center; }
}

.work-name { flex: 1; font-weight: 500; color: $text-primary; line-height: 1.3; }
.work-detail { color: $text-secondary; white-space: nowrap; }
.work-total { font-weight: 600; color: $primary; white-space: nowrap; }

// Анимации
.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; max-height: 300px; overflow: hidden; }
.slide-enter-from, .slide-leave-to { max-height: 0; opacity: 0; }

span {
  color: unset;
}
</style>