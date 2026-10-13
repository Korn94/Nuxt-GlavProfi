<!-- app/components/ui/calculator/cards/FinishCardOptions.vue -->
<template>
  <div class="options-panel">
    <div v-for="(opt, key) in optionsConfig" :key="key" class="option-group">
      <label class="option-label">{{ opt.label }}:</label>
      <div class="radio-group">
        <label
          v-for="val in opt.values"
          :key="val.value"
          class="radio-item"
          :class="{ 'is-selected': currentOptions[key] === val.value }"
        >
          <input
            type="radio"
            :name="`${instanceId}-${key}`"
            :value="val.value"
            :checked="currentOptions[key] === val.value"
            @change="onChange(key, val.value)"
            class="radio-input"
          >
          <span class="radio-text">{{ cleanLabel(val.label) }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FinishOptionConfig } from '~/types/calculator'

const props = defineProps<{
  optionsConfig: Record<string, FinishOptionConfig>
  currentOptions: Record<string, string>
  instanceId: string
}>()

const emit = defineEmits<{
  'update-option': [payload: { instanceId: string; optionKey: string; value: string }]
}>()

function onChange(key: string, value: string) {
  emit('update-option', { instanceId: props.instanceId, optionKey: key, value })
}

/**
 * Удаляет слово "(стандарт)" из метки, если оно есть.
 */
function cleanLabel(label: string): string {
  return label.replace(/\s*\(стандарт\)/i, '').trim()
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables" as *;

// === Панель опций (тёмная тема) ===
.options-panel {
  background: rgba(0, 195, 245, 0.04);
  padding: 1rem 1.2rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(0, 195, 245, 0.08);
}

// === Лейбл группы опций ===
.option-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: rgba($text-light, 0.6);
  margin-bottom: 0.4rem;
  font-family: 'Rubik', sans-serif;
  display: block;
}

// === Группа радио-кнопок ===
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

// === Радио-кнопка (пилюля) ===
.radio-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px solid rgba(255, 255, 255, 0.12);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-size: 0.85rem;
  font-family: 'Rubik', sans-serif;
  color: rgba($text-light, 0.75);

  &:hover {
    border-color: rgba(0, 195, 245, 0.4);
    background: rgba(0, 195, 245, 0.06);
    color: $text-light;
  }

  &.is-selected {
    background: $blue-gradient;
    color: $background-dark;
    border-color: transparent;
    font-weight: 600;
    box-shadow: 0 2px 8px rgba(0, 195, 245, 0.25);
  }

  // Focus-visible для accessibility
  &:has(.radio-input:focus-visible) {
    outline: 2px solid $blue;
    outline-offset: 2px;
  }
}

// === Скрытый нативный radio ===
.radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}

// === Текст опции ===
.radio-text {
  white-space: nowrap;
  line-height: 1.3;
}

// === Адаптив ===
@media (max-width: 480px) {
  .radio-group {
    gap: 0.4rem;
  }

  .radio-item {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}
</style>