<!-- app/components/pages/cabinet/Operation/DateFilter.vue -->
<template>
  <div class="date-filter">

    <!-- Быстрые кнопки месяцев -->
    <div class="date-filter__months">
      <button v-for="offset in [-2, -1, 0]" :key="offset" class="month-btn"
        :class="{ 'month-btn--active': isActiveMonth(offset) }" @click="setMonth(offset)">
        {{ getMonthName(offset) }}
      </button>
    </div>

    <!-- Ручной ввод дат -->
    <div class="date-filter__controls">
      <div class="date-filter__range">
        <span class="date-filter__label">С</span>
        <input type="date" v-model="localStartDate" class="date-filter__input" :max="localEndDate"
          @input="$emit('update:start-date', localStartDate)" />
        <span class="date-filter__sep">—</span>
        <span class="date-filter__label">По</span>
        <input type="date" v-model="localEndDate" class="date-filter__input" :min="localStartDate"
          @input="$emit('update:end-date', localEndDate)" />
      </div>

      <div class="date-filter__actions">
        <button class="crm-btn crm-btn--accent crm-btn--sm" :disabled="!canApply" @click="$emit('apply')">
          <Icon name="mdi:check" size="14" />
          Применить
        </button>
        <button class="crm-btn crm-btn--ghost crm-btn--sm" @click="$emit('reset')">
          <Icon name="mdi:refresh" size="14" />
          Сбросить
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps < {
  startDate: string
  endDate: string
} > ()

const emit = defineEmits < {
  'update:start-date': [value: string]
  'update:end-date': [value: string]
  'apply': []
  'reset': []
} > ()

const localStartDate = ref(props.startDate)
const localEndDate = ref(props.endDate)

const canApply = computed(() => !!localStartDate.value && !!localEndDate.value)

// ── Синхронизация с пропсами ─────────────────────────────────────────
watch(() => props.startDate, val => { localStartDate.value = val })
watch(() => props.endDate, val => { localEndDate.value = val })

// ── Вспомогательные ─────────────────────────────────────────────────
const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

function getMonthName(offset: number) {
  const now = new Date()
  const idx = ((now.getMonth() + offset) % 12 + 12) % 12
  return monthNames[idx]
}

function isActiveMonth(offset: number) {
  if (!localStartDate.value || !localEndDate.value) return false
  const now = new Date()
  const year = Math.floor((now.getFullYear() * 12 + now.getMonth() + offset) / 12)
  const month = ((now.getMonth() + offset) % 12 + 12) % 12
  const start = formatDate(new Date(year, month, 1))
  const end = formatDate(new Date(year, month + 1, 0))
  return localStartDate.value === start && localEndDate.value === end
}

function setMonth(offset: number) {
  const now = new Date()
  const year = Math.floor((now.getFullYear() * 12 + now.getMonth() + offset) / 12)
  const month = ((now.getMonth() + offset) % 12 + 12) % 12
  localStartDate.value = formatDate(new Date(year, month, 1))
  localEndDate.value = formatDate(new Date(year, month + 1, 0))
  emit('update:start-date', localStartDate.value)
  emit('update:end-date', localEndDate.value)
  emit('apply')
}

function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
</script>

<style lang="scss" scoped>
.date-filter {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  // ── Кнопки месяцев ──────────────────────────────────────────────
  &__months {
    display: flex;
    gap: 4px;
  }

  // ── Контролы ────────────────────────────────────────────────────
  &__controls {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    flex: 1;
  }

  &__range {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }

  &__label {
    font-size: var(--crm-text-xs);
    color: var(--crm-text-muted);
    white-space: nowrap;
  }

  &__sep {
    color: var(--crm-text-disabled);
    font-size: var(--crm-text-sm);
  }

  &__input {
    background: var(--crm-bg-elevated);
    border: 1px solid var(--crm-border-hover);
    border-radius: var(--crm-radius-md);
    color: var(--crm-text-primary);
    font-size: var(--crm-text-sm);
    font-family: var(--crm-font-sans);
    padding: 6px 10px;
    outline: none;
    transition: var(--crm-transition);
    min-width: 130px;

    &:focus {
      border-color: var(--crm-accent);
      box-shadow: 0 0 0 3px var(--crm-accent-dim);
    }

    // Цвет иконки календаря
    color-scheme: dark;
  }

  &__actions {
    display: flex;
    gap: 6px;
  }
}

// ── Кнопки месяцев ──────────────────────────────────────────────────
.month-btn {
  padding: 5px 12px;
  background: var(--crm-bg-elevated);
  border: 1px solid var(--crm-border);
  border-radius: var(--crm-radius-md);
  color: var(--crm-text-secondary);
  font-size: var(--crm-text-sm);
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  &:hover {
    background: var(--crm-bg-overlay);
    border-color: var(--crm-border-hover);
    color: var(--crm-text-primary);
  }

  &--active {
    background: var(--crm-accent-dim);
    border-color: var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover {
      background: var(--crm-accent-dim);
      color: var(--crm-accent);
    }
  }
}

// ── Кнопки ──────────────────────────────────────────────────────────
.crm-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border-radius: var(--crm-radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: var(--crm-transition);
  white-space: nowrap;

  &--sm {
    padding: 6px 12px;
    font-size: var(--crm-text-sm);
  }

  &--accent {
    background: var(--crm-accent-dim);
    border: 1px solid var(--crm-accent-border);
    color: var(--crm-accent);

    &:hover:not(:disabled) {
      background: rgba(0, 195, 245, 0.25);
    }

    &:disabled {
      opacity: .45;
      cursor: not-allowed;
    }
  }

  &--ghost {
    background: transparent;
    border: 1px solid var(--crm-border-hover);
    color: var(--crm-text-secondary);

    &:hover {
      background: var(--crm-bg-elevated);
      color: var(--crm-text-primary);
    }
  }
}

@media (max-width: 700px) {
  .date-filter {
    flex-direction: column;
    align-items: stretch;

    &__controls {
      flex-direction: column;
    }

    &__range {
      flex-wrap: wrap;
    }
  }
}
</style>