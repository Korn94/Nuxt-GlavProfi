<!-- app/components/ui/calculator/cards/FinishCardHeader.vue -->
<template>
  <header class="card-header">
    <span class="card-icon">{{ config?.icon || '🔹' }}</span>
    <h4 class="card-title">{{ config?.name }}</h4>
    
    <div class="card-controls">
      <!-- Площадь -->
      <div class="area-control">
        <input 
          type="number" 
          :value="instance.area" 
          @input="onAreaInput" 
          class="area-input" 
          min="0.5" 
          step="0.5"
          title="Площадь покрытия"
        >
        <span class="area-unit">м²</span>
      </div>

      <!-- Удалить -->
      <button type="button" class="btn-delete" @click="emit('remove')" title="Удалить покрытие">
        <Icon name="material-symbols:delete-outline" size="20" />
      </button>
      
      <!-- Стрелка раскрытия допов -->
      <button type="button" class="btn-extras-toggle" @click="emit('toggle-extras')" :class="{ 'is-active': showExtras }" title="Показать/скрыть дополнительные работы">
        <Icon name="material-symbols:add-circle-outline" size="22" />
        <span class="toggle-label">Допы</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import type { SurfaceInstance, FinishGroupConfig } from '~/types/calculator'

defineProps<{
  config: FinishGroupConfig | undefined
  instance: SurfaceInstance
  showExtras: boolean
}>()

const emit = defineEmits<{
  'update-area': [area: number]
  'remove': []
  'toggle-extras': []
}>()

function onAreaInput(event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  emit('update-area', isNaN(val) ? 0.5 : Math.max(0.5, val))
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/calculator-vars.scss" as *;

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: $bg-light;
  border-bottom: 1px solid $border-color;
}

.card-icon { font-size: 1.4rem; }
.card-title { margin: 0; flex: 1; font-size: 1rem; font-weight: 600; color: $text-primary; }

.card-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.area-control {
  position: relative;
  width: 120px;
  .area-input {
    width: 100%; padding: 6px 28px 6px 8px;
    border: 1px solid $border-color; border-radius: 6px;
    text-align: right; font-size: 0.9rem; font-weight: 500; color: $text-primary;
    &:focus { border-color: $primary; outline: none; }
  }
  .area-unit {
    position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
    font-size: 0.75rem; color: $text-secondary; pointer-events: none;
  }
}

.btn-delete {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  border: none; background: transparent; color: $danger; cursor: pointer; opacity: 0.7; border-radius: 6px;
  &:hover { opacity: 1; background: rgba($danger, 0.1); }
}

.btn-extras-toggle {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border: 1px solid $primary; background: transparent;
  color: $primary; border-radius: 16px; cursor: pointer; font-size: 0.8rem; font-weight: 500;
  transition: all 0.2s;
  &:hover { background: rgba($primary, 0.05); }
  &.is-active { background: $primary; color: white; }
  .toggle-label { margin-left: 2px; }
}

span {
  color: unset;
}
</style>