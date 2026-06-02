<!-- app\components\pages\public\prices\ui\SelectOrInput.vue -->
<template>
  <div class="select-or-input">
    <select v-model="selectedValue" @change="handleChange">
      <option v-for="option in predefinedOptions" :key="option" :value="option">
        {{ option }}
      </option>
      <option value="custom">Другое</option>
    </select>
    <input
      v-if="isCustom"
      v-model="customValue"
      placeholder="Введите значение"
      @input="handleCustomInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ========================================
// 📥 ПРОПСЫ И ЭМИТЫ
// ========================================

const props = withDefaults(defineProps<{
  modelValue: string
}>(), {
  modelValue: 'м²'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// ========================================
// 📋 КОНСТАНТЫ
// ========================================

/**
 * Предустановленные варианты единиц измерения.
 * Если пришедшее значение не входит в этот список — считаем его "другим" (custom).
 */
const predefinedOptions = ['м²', 'м³', 'м.п.', 'шт', 'от'] as const
const CUSTOM_VALUE = 'custom'

// ========================================
// 📊 ЛОКАЛЬНОЕ СОСТОЯНИЕ
// ========================================

/**
 * Текущее значение в select (либо одна из предустановленных опций, либо 'custom').
 */
const selectedValue = ref<string>('')

/**
 * Значение кастомного поля ввода (используется когда selectedValue === 'custom').
 */
const customValue = ref<string>('')

// ========================================
// 🧮 ВЫЧИСЛЯЕМЫЕ СВОЙСТВА
// ========================================

/**
 * Выбран ли режим "Другое" (ввод пользовательского значения).
 */
const isCustom = computed(() => selectedValue.value === CUSTOM_VALUE)

// ========================================
// 🎯 ИНИЦИАЛИЗАЦИЯ СОСТОЯНИЯ
// ========================================

/**
 * Синхронизирует локальное состояние с пришедшим из родителя значением.
 * 
 * Логика:
 * - Если значение есть в предустановленном списке — выбираем его в select
 * - Если значения нет в списке — переключаем select в режим "Другое"
 *   и заполняем customValue (чтобы пользователь видел текущее значение)
 */
const syncWithModelValue = (value: string) => {
  if (!value) {
    // Пустое значение — выбираем дефолт
    selectedValue.value = predefinedOptions[0]
    customValue.value = ''
    return
  }

  if (predefinedOptions.includes(value as any)) {
    // Значение из предустановленного списка
    selectedValue.value = value
    customValue.value = ''
  } else {
    // Кастомное значение (например, при редактировании работы с нестандартной единицей)
    selectedValue.value = CUSTOM_VALUE
    customValue.value = value
  }
}

// Первичная инициализация
syncWithModelValue(props.modelValue)

// ========================================
// 🔄 СИНХРОНИЗАЦИЯ С РОДИТЕЛЕМ
// ========================================

/**
 * Watch на изменения modelValue из родителя.
 * 
 * Это нужно, когда:
 * 1. Пользователь открывает форму редактирования работы — подставляются её текущие данные
 * 2. Родительский компонент программно меняет значение
 * 3. При откате оптимистичного обновления (restore из snapshot)
 */
watch(
  () => props.modelValue,
  (newValue) => {
    // Избегаем зацикливания: обновляем только если значение реально изменилось
    const currentValue = isCustom.value ? customValue.value : selectedValue.value
    if (currentValue !== newValue) {
      syncWithModelValue(newValue)
    }
  }
)

// ========================================
// 🎯 ОБРАБОТЧИКИ СОБЫТИЙ
// ========================================

/**
 * Пользователь выбрал опцию в select.
 * 
 * Особый случай: если выбран 'custom' — ничего не эмитим,
 * ждём ввода в текстовом поле.
 */
const handleChange = () => {
  if (selectedValue.value === CUSTOM_VALUE) {
    // При переключении на "Другое" очищаем customValue,
    // чтобы пользователь видел пустое поле для ввода
    customValue.value = ''
    return
  }
  
  // Эмитим выбранную предустановленную опцию
  emit('update:modelValue', selectedValue.value)
}

/**
 * Пользователь ввёл значение в кастомное поле.
 */
const handleCustomInput = () => {
  emit('update:modelValue', customValue.value)
}
</script>

<style lang="scss" scoped>
.select-or-input {
  display: flex;
  gap: 10px;
  
  select,
  input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
  }
  
  input {
    flex: 1;
  }
}
</style>