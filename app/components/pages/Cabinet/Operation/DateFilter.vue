<template>
  <section class="filter-section">
    <!-- <header class="filter-header">
      <h2>Фильтр по дате</h2>
    </header> -->
    <div class="filter-buttons">
      <!-- Кнопки с названиями месяцев -->
      <button
        @click="setMonth(-2)"
        class="btn btn-outline btn-small"
        :title="getMonthName(-2)"
      >
        {{ getMonthName(-2) }}
      </button>
      <button
        @click="setMonth(-1)"
        class="btn btn-outline btn-small"
        :title="getMonthName(-1)"
      >
        {{ getMonthName(-1) }}
      </button>
      <button
        @click="setMonth(0)"
        class="btn btn-outline btn-small"
        :title="getMonthName(0)"
      >
        {{ getMonthName(0) }}
      </button>
    </div>
    <div class="filter-controls">
      <label for="start-date" class="visually-hidden">Начальная дата</label>
      <input
        id="start-date"
        type="date"
        v-model="localStartDate"
        class="date-input"
        :max="localEndDate"
        @input="$emit('update:start-date', localStartDate)"
      />
      <label for="end-date" class="visually-hidden">Конечная дата</label>
      <input
        id="end-date"
        type="date"
        v-model="localEndDate"
        class="date-input"
        :min="localStartDate"
        @input="$emit('update:end-date', localEndDate)"
      />

      <button
        @click="$emit('apply')"
        class="btn btn-primary"
        :disabled="!canApply"
      >
        Применить
      </button>
      <button
        @click="$emit('reset')"
        class="btn btn-outline"
      >
        Сбросить
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  }
})

const localStartDate = ref(props.startDate)
const localEndDate = ref(props.endDate)

const canApply = computed(() => {
  return localStartDate.value && localEndDate.value
})

watch(
  () => props.startDate,
  (newVal) => {
    localStartDate.value = newVal
  }
)
watch(
  () => props.endDate,
  (newVal) => {
    localEndDate.value = newVal
  }
)

// Названия месяцев на русском
const monthNames = [
  'Январь', 'Февраль', 'Март', 'Апрель',
  'Май', 'Июнь', 'Июль', 'Август',
  'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

// Получить название месяца (смещение: 0 — текущий, -1 — прошлый и т.д.)
const getMonthName = (offset) => {
  const now = new Date()
  const monthIndex = (now.getMonth() + offset + 12) % 12
  return monthNames[monthIndex]
}

// Форматирование даты в строку YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Установить месяц по смещению (в днях не надо, мы работаем с месяцем целиком)
const setMonth = (offset) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + offset

  // Вычисляем год с учётом переполнения (например, январь -1 = декабрь прошлого года)
  const targetYear = Math.floor((year * 12 + month) / 12)
  const targetMonth = (month + 12) % 12

  const start = new Date(targetYear, targetMonth, 1)
  const end = new Date(targetYear, targetMonth + 1, 0) // последний день

  localStartDate.value = formatDate(start)
  localEndDate.value = formatDate(end)

  emit('update:start-date', localStartDate.value)
  emit('update:end-date', localEndDate.value)
  emit('apply') // автоматически применяем фильтр
}

const emit = defineEmits(['update:start-date', 'update:end-date', 'apply', 'reset'])
</script>

<style lang="scss" scoped>
$primary-color: #007bff;
$success-color: #28a745;
$danger-color: #dc3545;
$warning-color: #ffc107;
$info-color: #17a2b8;
$dark-color: #343a40;
$light-color: #f8f9fa;
$gray-light: #e9ecef;
$gray: #6c757d;
$border-radius: 8px;
$box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
$transition: all 0.3s ease;

.filter-header {
  margin-bottom: 1rem;
  text-align: center;
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: $dark-color;
    margin: 0;
  }
}

.filter-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: end;
}

.filter-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1em;
}

.date-input {
  padding: 0.6rem;
  border: 1px solid $gray-light;
  border-radius: $border-radius;
  font-size: 1rem;
  min-width: 140px;
  transition: border-color $transition;

  &:focus {
    outline: none;
    border-color: $primary-color;
    box-shadow: 0 0 0 3px rgba($primary-color, 0.2);
  }
}

.btn {
  height: fit-content;
  &.btn-primary {
    background-color: $primary-color;
    border: 1px solid $primary-color;
    color: white;
    padding: 0.6rem 1rem;
    border-radius: $border-radius;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover:enabled {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
  &.btn-outline {
    background-color: transparent;
    border: 1px solid $gray;
    color: $gray;
    padding: 0.6rem 1rem;
    border-radius: $border-radius;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    &:hover:enabled {
      background-color: $light-color;
      color: $dark-color;
    }
  }
  &.btn-small {
    font-size: 0.85rem;
    padding: 0.5rem 0.8rem;
  }
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>