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
      <button
        type="button"
        class="btn-extras-toggle"
        @click="emit('toggle-extras')"
        :class="{ 'is-active': showExtras }"
        title="Показать/скрыть дополнительные работы"
      >
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
@use "@/assets/styles/variables" as *;

// === Шапка карточки покрытия (тёмная тема) ===
.card-header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.card-icon {
  font-size: 1.4rem;
  flex-shrink: 0;
  line-height: 1;
}

.card-title {
  margin: 0;
  flex: 1;
  font-size: 1.05rem;
  font-weight: 600;
  color: $text-light;
  font-family: 'Rubik', sans-serif;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// === Контролы ===
.card-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

// === Инпут площади ===
.area-control {
  position: relative;
  width: 110px;

  .area-input {
    width: 100%;
    padding: 0.45rem 2rem 0.45rem 0.6rem;
    border: 1.5px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    text-align: right;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: 'Rubik', sans-serif;
    color: $text-light;
    background: rgba(255, 255, 255, 0.04);
    transition: all 0.25s ease;

    -moz-appearance: textfield;
    appearance: textfield;

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    &:focus {
      outline: none;
      border-color: $blue;
      background: rgba(0, 195, 245, 0.06);
      box-shadow: 0 0 0 3px rgba(0, 195, 245, 0.12);
    }
  }

  .area-unit {
    position: absolute;
    right: 0.6rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.75rem;
    color: rgba($text-light, 0.45);
    pointer-events: none;
    font-family: 'Rubik', sans-serif;
  }
}

// === Кнопка удаления ===
.btn-delete {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(#ff6b6b, 0.6);
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #ff6b6b;
    background: rgba(#ff6b6b, 0.12);
  }
}

// === Кнопка "Допы" ===
.btn-extras-toggle {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem 0.8rem;
  border: 1.5px solid rgba(0, 195, 245, 0.35);
  background: transparent;
  color: $blue-light;
  border-radius: 50px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  font-family: 'Rubik', sans-serif;
  transition: all 0.25s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(0, 195, 245, 0.08);
    border-color: $blue;
  }

  &.is-active {
    background: $blue-gradient;
    border-color: transparent;
    color: $background-dark;

    .toggle-label {
      font-weight: 600;
    }
  }

  .toggle-label {
    margin-left: 0.1rem;
  }
}

// === Адаптив ===
@media (max-width: 640px) {
  .card-header {
    flex-wrap: wrap;
    gap: 0.6rem;
    padding: 0.9rem 1rem;
  }

  .card-title {
    flex-basis: calc(100% - 2.5rem); // Оставляем место для иконки
  }

  .card-controls {
    width: 100%;
    justify-content: flex-end;
    gap: 0.4rem;
    padding-left: calc(1.4rem + 0.8rem); // Отступ под иконку
  }

  .area-control {
    width: 100px;
  }

  .btn-extras-toggle {
    .toggle-label {
      display: none; // На мобильных оставляем только иконку
    }

    padding: 0.35rem 0.6rem;
  }
}
</style>