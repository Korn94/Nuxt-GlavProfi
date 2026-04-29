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
            :name="key" 
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
@use "@/assets/styles/calculator-vars.scss" as *;

.options-panel {
  background: rgba($primary, 0.03);
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.option-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: $text-secondary;
  margin-bottom: 6px;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.radio-item {
  position: relative;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
  
  &:hover { border-color: $primary; }
  &.is-selected {
    background: $primary;
    color: white;
    border-color: $primary;
  }
}

.radio-input {
  position: absolute; opacity: 0; width: 0; height: 0;
}

.radio-text { white-space: nowrap; }

span {
  color: unset;
}
</style>